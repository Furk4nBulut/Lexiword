import type { LexicalNode } from 'lexical';
/**
 * PageAutoSplitPlugin
 *
 * Sayfa içerikleri dolduğunda taşan blokları otomatik olarak yeni sayfaya taşır.
 * Header/footer kopyalanır, PageNumberNode eklenir, içerik düzgün şekilde bölünür.
 */

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot
  // ParagraphNode,
  // TextNode,
  // LineBreakNode,
  // $isElementNode,
  // $isTextNode,
  // $isLineBreakNode
} from 'lexical';
import { $createPageNode, $isPageNode, type PageNode } from '../nodes/PageNode';
import { setHeaderFooterSyncEnabled } from '../context/HeaderFooterSyncModeContext';
import PageNumberNode, { $createPageNumberNode } from '../nodes/PageNumberNode';
import { isContentNode, isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';
import { PageContentNode } from '../nodes/PageContentNode';
import { FooterTextNode } from '../nodes/FooterTextNode';

export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

/**
 * Yardımcı fonksiyon: Header/Footer klonlamak için
 */
function cloneSection<T extends LexicalNode>(sectionNode: T | null): T | null {
  if (sectionNode == null) return null;

  // Derin klon: node'un tipini ve tüm çocuklarını clone() ile kopyala
  const SectionClass = sectionNode.constructor as new () => T;
  const clonedSection = new SectionClass();

  sectionNode.getChildren().forEach((child: LexicalNode | null | undefined) => {
    if (child !== null && child !== undefined && typeof (child as any).clone === 'function') {
      // Eğer orijinal node bir TextNode ise ve parent footer ise FooterTextNode olarak ekle
      if (
        clonedSection.getType() === 'page-footer' &&
        typeof child.getType === 'function' &&
        child.getType() === 'text'
      ) {
        clonedSection.append(new FooterTextNode(child.getTextContent()));
      } else {
        clonedSection.append((child as any).clone());
      }
    }
  });

  return clonedSection;
}

export function PageAutoSplitPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm
}: PageFlowSettings): null {
  const [editor] = useLexicalComposerContext();
  const isReflowingRef = useRef(false);

  useEffect(() => {
    // Sadece taşma olduğunda reflow başlatmak için yardımcı fonksiyon
    function isAnyPageOverflow(): boolean {
      const root = $getRoot();
      let overflow = false;
      root.getChildren().forEach((child) => {
        if ($isPageNode(child)) {
          const pageEl = editor.getElementByKey(child.getKey());
          if (pageEl !== null && pageEl !== undefined) {
            const {
              el: contentDomEl,
              height: capacity,
              paddingTop,
              paddingBottom
            } = getContentMetrics(pageEl);
            const targetForScroll = contentDomEl ?? pageEl;
            const usedScroll = getContentScrollHeight(targetForScroll, paddingTop, paddingBottom);
            if (usedScroll > capacity + 2) {
              overflow = true;
            }
          }
        }
      });
      return overflow;
    }

    function getPageEl(page: PageNode): HTMLElement | null {
      return editor.getElementByKey(page.getKey());
    }

    function getContentMetrics(pageEl: HTMLElement): {
      el: HTMLElement | null;
      top: number;
      bottom: number;
      height: number;
      paddingTop: number;
      paddingBottom: number;
    } {
      const el = pageEl.querySelector('[data-lexical-page-section="content"]');
      const contentEl = el instanceof HTMLElement ? el : null;
      const target = contentEl ?? pageEl;
      const rect = target.getBoundingClientRect();
      const styles = window.getComputedStyle(target);
      let paddingTop = parseFloat(styles.paddingTop);
      let paddingBottom = parseFloat(styles.paddingBottom);
      if (Number.isNaN(paddingTop)) paddingTop = 0;
      if (Number.isNaN(paddingBottom)) paddingBottom = 0;
      const top = rect.top + paddingTop;
      const bottom = rect.bottom - paddingBottom;
      return { el: contentEl, top, bottom, height: bottom - top, paddingTop, paddingBottom };
    }

    function getContentScrollHeight(
      targetEl: HTMLElement,
      paddingTop: number,
      paddingBottom: number
    ): number {
      return targetEl.scrollHeight - paddingTop - paddingBottom;
    }

    function moveOverflowBlocksToNextPage(pageNode: PageNode, capacity: number): void {
      const contentSection = pageNode.getChildren().find(isContentNode);
      if (contentSection === null || contentSection === undefined) return;

      const blocks = contentSection.getChildren();
      if (blocks.length === 0) return;

      const el = editor.getElementByKey(contentSection.getKey());
      if (el === null || el === undefined) return;

      // Header & Footer yüksekliğini capacity'den düş
      const pageHeader = pageNode.getChildren().find(isHeaderNode);
      const pageFooter = pageNode.getChildren().find(isFooterNode);

      let headerHeight = 0;
      let footerHeight = 0;

      if (pageHeader !== null && pageHeader !== undefined) {
        const headerEl = editor.getElementByKey(pageHeader.getKey());
        if (headerEl !== null && headerEl !== undefined) headerHeight = headerEl.offsetHeight;
      }

      if (pageFooter !== null && pageFooter !== undefined) {
        const footerEl = editor.getElementByKey(pageFooter.getKey());
        if (footerEl !== null && footerEl !== undefined) footerHeight = footerEl.offsetHeight;
      }

      const minLineGap = 24;
      const adjustedCapacity = capacity - headerHeight - footerHeight - minLineGap;

      if (!(el.scrollHeight > adjustedCapacity + 2)) return;

      let nextPage = pageNode.getNextSibling();
      if (!$isPageNode(nextPage)) {
        // 1. Sync'i kapat
        setHeaderFooterSyncEnabled(false);

        nextPage = $createPageNode();

        // 2. Header kopyala
        const newHeader = cloneSection(pageHeader ?? null);
        if (newHeader !== null) nextPage.append(newHeader);

        // 3. Content ekle
        nextPage.append(new PageContentNode());

        // 4. Footer kopyala
        const newFooter = cloneSection(pageFooter ?? null);
        if (newFooter !== null) nextPage.append(newFooter);

        // 5. PageNumberNode kontrolü (sync kesinlikle kapalıyken)
        const root = pageNode.getParent();
        if (root !== null) {
          const allPages = root.getChildren().filter($isPageNode);
          const hasPageNumber = allPages.some((p) =>
            p.getChildren().some((c) => c instanceof PageNumberNode)
          );
          if (hasPageNumber) {
            const pageNumber = allPages.length + 1;
            nextPage.append($createPageNumberNode(String(pageNumber)));
          }
        }

        // 6. Sync'i tekrar aç
        setHeaderFooterSyncEnabled(true);

        pageNode.insertAfter(nextPage);
      }

      const nextContent = nextPage.getChildren().find(isContentNode);
      if (nextContent === null || nextContent === undefined) return;

      // Şimdilik sadece son bloğu taşıyor
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock !== null && lastBlock !== undefined) {
        nextContent.append(lastBlock);
      }
    }

    function reflowPass(): boolean {
      let didMoveAny = false;
      editor.update(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }

        const children = root.getChildren();
        const hasNonPage = children.some((n) => !$isPageNode(n));
        if (hasNonPage) {
          const page = $createPageNode();
          children.forEach((n) => {
            if (!$isPageNode(n)) {
              const contentSection = page.getChildren().find(isContentNode);
              if (contentSection !== null && contentSection !== undefined) contentSection.append(n);
            }
          });
          root.append(page);
        }

        let page = root.getFirstChild();
        while ($isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl === null || pageEl === undefined) {
            page = pageNode.getNextSibling();
            continue;
          }
          const {
            el: contentDomEl,
            height: capacity,
            paddingTop,
            paddingBottom
          } = getContentMetrics(pageEl);
          const targetForScroll = contentDomEl ?? pageEl;
          const usedScroll = getContentScrollHeight(targetForScroll, paddingTop, paddingBottom);
          if (usedScroll > capacity + 2) {
            moveOverflowBlocksToNextPage(pageNode, capacity);
            didMoveAny = true;
          }
          page = pageNode.getNextSibling();
        }
      });
      return didMoveAny;
    }

    // Reflow işlemini kontrollü başlatan fonksiyon
    function triggerReflowIfNeeded(): void {
      if (isReflowingRef.current) return;
      // Sadece taşma varsa reflow başlat
      editor.getEditorState().read(() => {
        if (!isAnyPageOverflow()) return;
        isReflowingRef.current = true;
        let passes = 0;
        const maxPasses = 30;
        function run(): void {
          const moved = reflowPass();
          passes++;
          if (moved && passes < maxPasses) {
            // Hala taşma varsa tekrar çalıştır
            setTimeout(run, 0);
          } else {
            isReflowingRef.current = false;
          }
        }
        run();
      });
    }

    // İlk mount'ta ve her update'te tetikle
    triggerReflowIfNeeded();

    const unregister = editor.registerUpdateListener((): void => {
      triggerReflowIfNeeded();
    });

    return (): void => {
      unregister();
      isReflowingRef.current = false;
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  return null;
}
