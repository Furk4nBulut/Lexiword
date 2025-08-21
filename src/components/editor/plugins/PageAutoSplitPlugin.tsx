import type { LexicalNode } from 'lexical';
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createPageNode, $isPageNode, type PageNode } from '../nodes/PageNode';
import { setHeaderFooterSyncEnabled } from '../context/HeaderFooterSyncModeContext';
import PageNumberNode, { $createPageNumberNode } from '../nodes/PageNumberNode';
import { isContentNode, isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';
import { PageContentNode } from '../nodes/PageContentNode';

export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

function cloneSection<T extends LexicalNode>(sectionNode: T | null): T | null {
  if (sectionNode == null) return null;
  const SectionClass = sectionNode.constructor as new () => T;
  const clonedSection = new SectionClass();
  sectionNode.getChildren().forEach((child: LexicalNode | null | undefined) => {
    if (child !== null && child !== undefined && typeof (child as any).clone === 'function') {
      clonedSection.append((child as any).clone());
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
  // Animasyon çerçevesi ID'sini saklamak için bir ref ekliyoruz.
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
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
        setHeaderFooterSyncEnabled(false);
        nextPage = $createPageNode();
        const newHeader = cloneSection(pageHeader ?? null);
        if (newHeader !== null) nextPage.append(newHeader);
        nextPage.append(new PageContentNode());
        const newFooter = cloneSection(pageFooter ?? null);
        if (newFooter !== null) nextPage.append(newFooter);
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
        setHeaderFooterSyncEnabled(true);
        pageNode.insertAfter(nextPage);
      }

      const nextContent = nextPage.getChildren().find(isContentNode);
      if (nextContent === null || nextContent === undefined) return;

      if (blocks.length === 1) {
        return;
      }

      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock !== null && lastBlock !== undefined) {
        // Klonlama mantığı yerine doğrudan taşıma daha güvenli olabilir,
        // ancak orijinal mantığı koruyoruz.
        lastBlock.remove(); // Önce çıkar
        const firstChildInNext = nextContent.getFirstChild();
        if (firstChildInNext !== null && firstChildInNext !== undefined) {
            firstChildInNext.insertBefore(lastBlock);
        } else {
            nextContent.append(lastBlock);
        }
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
          const contentSection = page.getChildren().find(isContentNode);
          if (contentSection) {
            children.forEach((n) => {
              if (!$isPageNode(n)) {
                contentSection.append(n);
              }
            });
          }
          root.append(page);
        }
        let page = root.getFirstChild();
        while (page !== null && $isPageNode(page)) {
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

    function triggerReflowIfNeeded(): void {
      if (isReflowingRef.current) return;
      editor.getEditorState().read(() => {
        if (!isAnyPageOverflow()) return;

        isReflowingRef.current = true;
        let passes = 0;
        const maxPasses = 30; // Güvenlik ağı

        function run(): void {
          // Önceki animasyon çerçevesini temizle
          if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
          }
          
          const moved = reflowPass();
          passes++;
          if (moved && passes < maxPasses) {
            // setTimeout yerine requestAnimationFrame kullan
            animationFrameIdRef.current = requestAnimationFrame(run);
          } else {
            isReflowingRef.current = false;
            animationFrameIdRef.current = null;
          }
        }
        run();
      });
    }

    triggerReflowIfNeeded();
    const unregister = editor.registerUpdateListener((): void => {
      triggerReflowIfNeeded();
    });

    return (): void => {
      unregister();
      isReflowingRef.current = false;
      // Component kaldırıldığında bekleyen bir animasyon çerçevesi varsa iptal et.
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  return null;
}