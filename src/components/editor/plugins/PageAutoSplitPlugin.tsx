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
  $getRoot,
  ParagraphNode,
  TextNode,
  LineBreakNode,
  $isElementNode,
  $isTextNode,
  $isLineBreakNode,
} from 'lexical';
import { $createPageNode, $isPageNode, type PageNode } from '../nodes/PageNode';
import PageNumberNode, { $createPageNumberNode } from '../nodes/PageNumberNode';
import { isContentNode, isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';
import { PageContentNode } from '../nodes/PageContentNode';

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

  const SectionClass = sectionNode.constructor as { new (): T };
  const clonedSection = new SectionClass();

  sectionNode.getChildren().forEach((child) => {
    if ($isElementNode(child)) {
      const para = new ParagraphNode();
      child.getChildren().forEach((grandChild) => {
        if ($isTextNode(grandChild)) {
          para.append(new TextNode(grandChild.getTextContent() ?? ''));
        } else if ($isLineBreakNode(grandChild)) {
          para.append(new LineBreakNode());
        }
      });
      clonedSection.append(para);
    } else if ($isTextNode(child)) {
      clonedSection.append(new TextNode(child.getTextContent() ?? ''));
    } else if ($isLineBreakNode(child)) {
      clonedSection.append(new LineBreakNode());
    }
  });

  return clonedSection;
}

export function PageAutoSplitPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm,
}: PageFlowSettings): null {
  const [editor] = useLexicalComposerContext();
  const rafRef = useRef<number | null>(null);
  const isReflowingRef = useRef(false);

  useEffect(() => {
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
      if (contentSection == null) return;

      const blocks = contentSection.getChildren();
      if (blocks.length === 0) return;

      const el = editor.getElementByKey(contentSection.getKey());
      if (el == null) return;

      // Header & Footer yüksekliğini capacity'den düş
      const pageHeader = pageNode.getChildren().find(isHeaderNode);
      const pageFooter = pageNode.getChildren().find(isFooterNode);

      let headerHeight = 0;
      let footerHeight = 0;

      if (pageHeader) {
        const headerEl = editor.getElementByKey(pageHeader.getKey());
        if (headerEl) headerHeight = headerEl.offsetHeight;
      }

      if (pageFooter) {
        const footerEl = editor.getElementByKey(pageFooter.getKey());
        if (footerEl) footerHeight = footerEl.offsetHeight;
      }

      const minLineGap = 24;
      const adjustedCapacity = capacity - headerHeight - footerHeight - minLineGap;

      if (!(el.scrollHeight > adjustedCapacity + 2)) return;

      let nextPage = pageNode.getNextSibling();
      if (!$isPageNode(nextPage)) {
        nextPage = $createPageNode();

        // Header kopyala
        const newHeader = cloneSection(pageHeader);
        if (newHeader) nextPage.append(newHeader);

        // Content ekle
        nextPage.append(new PageContentNode());

        // Footer kopyala
        const newFooter = cloneSection(pageFooter);
        if (newFooter) nextPage.append(newFooter);

        // PageNumberNode kontrolü
        const root = pageNode.getParent();
        if (root !== null) {
          const allPages = root.getChildren().filter($isPageNode);
          const hasPageNumber = allPages.some((p) =>
            p.getChildren().some((c) => c instanceof PageNumberNode)
          );
          if (hasPageNumber) {
            const pageNumber = allPages.length + 1;
            nextPage.append($createPageNumberNode(pageNumber));
          }
        }

        pageNode.insertAfter(nextPage);
      }

      const nextContent = nextPage.getChildren().find(isContentNode);
      if (!nextContent) return;

      // Şimdilik sadece son bloğu taşıyor
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock) {
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
              if (contentSection) contentSection.append(n);
            }
          });
          root.append(page);
        }

        let page = root.getFirstChild();
        while ($isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl === null) {
            page = pageNode.getNextSibling();
            continue;
          }
          const {
            el: contentDomEl,
            height: capacity,
            paddingTop,
            paddingBottom,
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

    const schedule = (): void => {
      if (isReflowingRef.current) return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        isReflowingRef.current = true;
        let passes = 0;
        const maxPasses = 30;
        const run = (): void => {
          const moved = reflowPass();
          passes++;
          if (moved && passes < maxPasses) {
            setTimeout(run, 0);
          } else {
            isReflowingRef.current = false;
          }
        };
        setTimeout(run, 0);
      });
    };

    schedule();

    const unregister = editor.registerUpdateListener((): void => {
      schedule();
    });

    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      unregister();
      isReflowingRef.current = false;
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  return null;
}
