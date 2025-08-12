import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createTextNode,
  $createParagraphNode
} from 'lexical';
import type { ElementNode as LexicalElementNode } from 'lexical';
import { $createPageNode, $isPageNode, type PageNode } from '../nodes/PageNode';
import { isContentNode, isHeaderNode, isFooterNode } from '../nodes/sectionTypeGuards';
import { PageHeaderNode } from '../nodes/PageHeaderNode';
import { PageFooterNode } from '../nodes/PageFooterNode';
import { PageContentNode } from '../nodes/PageContentNode';

export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

export function PageAutoSplitPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm
}: PageFlowSettings): null {
  const [editor] = useLexicalComposerContext();
  const rafRef = useRef<number | null>(null);
  const isReflowingRef = useRef(false);
  const unbreakableTooTallKeysRef = useRef<Set<string>>(new Set());

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

    function getContentScrollHeight(targetEl: HTMLElement, paddingTop: number, paddingBottom: number): number {
      return targetEl.scrollHeight - paddingTop - paddingBottom;
    }

    function proportionalSplitParagraphByHeight(
      block: LexicalElementNode,
      currentHeightPx: number,
      targetHeightPx: number
    ): boolean {
      const textNodes = block.getChildren().filter($isTextNode);
      if (textNodes.length === 0) return false;
      const totalChars = textNodes.reduce((sum, t) => sum + t.getTextContent().length, 0);
      if (totalChars < 2) return false;
      const keepChars = Math.max(
        1,
        Math.min(totalChars - 1, Math.floor((targetHeightPx / currentHeightPx) * totalChars))
      );
      let remainingToKeep = keepChars;
      const newPara = $createParagraphNode();
      const movedNodes: Array<ReturnType<typeof $createTextNode>> = [];
      for (const t of textNodes) {
        if (remainingToKeep <= 0) {
          movedNodes.push($createTextNode(t.getTextContent()));
          t.remove();
          continue;
        }
        const text = t.getTextContent();
        if (text.length <= remainingToKeep) {
          remainingToKeep -= text.length;
          continue;
        }
        const left = text.slice(0, remainingToKeep);
        const right = text.slice(remainingToKeep);
        t.setTextContent(left);
        movedNodes.push($createTextNode(right));
        remainingToKeep = 0;
      }
      if (movedNodes.length === 0) return false;
      movedNodes.forEach((n) => newPara.append(n));
      block.insertAfter(newPara);
      return true;
    }

    function pickMovableBlock(blocks: LexicalElementNode[]): LexicalElementNode | null {
      for (let i = blocks.length - 1; i >= 0; i--) {
        const node = blocks[i];
        const el = editor.getElementByKey(node.getKey());
        const height = el?.offsetHeight ?? 0;
        const textGetter = (node as unknown as { getTextContent?: () => string }).getTextContent;
        const text = typeof textGetter === 'function' ? textGetter.call(node) : '';
        if ((text?.trim()?.length ?? 0) > 0 || height > 2) {
          return node;
        }
      }
      return blocks.length > 0 ? blocks[blocks.length - 1] : null;
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
              // Move foreign nodes into first page's content section
              const contentSection = page.getChildren().find((c: any): c is PageContentNode => isContentNode(c));
              if (contentSection != null) contentSection.append(n);
            }
          });
          root.append(page);
        }

        let page = root.getFirstChild();
        let lastPageNode: PageNode | null = null;
        let lastPageEl: HTMLElement | null = null;
        let lastCapacity = 0;
        let lastUsedScroll = 0;
        while ($isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl === null) {
            page = pageNode.getNextSibling();
            continue;
          }
          if (pageEl.clientHeight === 0 || pageEl.scrollHeight === 0) {
            page = pageNode.getNextSibling();
            continue;
          }

          const { el: contentDomEl, height: capacity, top: contentTop, paddingTop, paddingBottom } =
            getContentMetrics(pageEl);
          // Resolve content section node
          const contentSection = pageNode.getChildren().find((c: any): c is PageContentNode => isContentNode(c));
          const blocks = contentSection?.getChildren() ?? [];

          // Deepest child bottom and sum of heights
          let deepestBottom = contentTop;
          let sumHeights = 0;
          for (let i = 0; i < blocks.length; i++) {
            const el = editor.getElementByKey(blocks[i].getKey());
            if (el == null) continue;
            const r = el.getBoundingClientRect();
            if (r.bottom > deepestBottom) deepestBottom = r.bottom;
            sumHeights += el.offsetHeight;
          }
          const usedDeepest = Math.max(0, deepestBottom - contentTop);
          const usedSum = sumHeights;
          const targetForScroll = contentDomEl ?? pageEl;
          const usedScroll = getContentScrollHeight(targetForScroll, paddingTop, paddingBottom);

          // Overflow if both metrics exceed, OR scroll-based says content exceeds capacity
          const tolDeepest = 1;
          const tolSum = 6;
          const scrollTol = 2;
          const overflow =
            (usedDeepest > capacity - tolDeepest && usedSum > capacity - tolSum) ||
            usedScroll > capacity + scrollTol;

          if (overflow) {
            const elementBlocks = blocks.filter((b): b is LexicalElementNode => typeof (b as LexicalElementNode).getChildren === 'function');
            const candidate = pickMovableBlock(elementBlocks);
            if (candidate != null) {
              if (blocks.length === 1) {
                const el = editor.getElementByKey(candidate.getKey());
                const currentH = el?.offsetHeight ?? usedDeepest;
                const key = candidate.getKey();
                if (!unbreakableTooTallKeysRef.current.has(key)) {
                  const ok = proportionalSplitParagraphByHeight(candidate, currentH, capacity);
                  if (!ok) {
                    unbreakableTooTallKeysRef.current.add(key);
                    let nextPage = pageNode.getNextSibling();
                    if (!$isPageNode(nextPage)) {
                      nextPage = $createPageNode();
                      pageNode.insertAfter(nextPage);
                    }
                    const nextContent = nextPage.getChildren().find((c: any): c is PageContentNode => isContentNode(c));
                    if (nextContent != null) nextContent.append(candidate);
                  }
                }
              } else {
                let nextPage = pageNode.getNextSibling();
                if (!$isPageNode(nextPage)) {
                  nextPage = $createPageNode();
                  pageNode.insertAfter(nextPage);
                }
                const nextContent = nextPage.getChildren().find((c: any): c is PageContentNode => isContentNode(c));
                if (nextContent != null) nextContent.append(candidate);
              }

              // Cursor otomatik yeni sayfaya taşınsın
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const next = pageNode.getNextSibling();
                if ($isPageNode(next)) {
                  const nextContent = next.getChildren().find((c: any): c is PageContentNode => isContentNode(c));
                  const firstChild = nextContent?.getFirstChild() ?? null;
                  if (firstChild != null) {
                    firstChild.selectStart();
                    // Cursor yeni sayfaya taşındıysa scroll et
                    setTimeout(() => {
                      const el = editor.getElementByKey(firstChild.getKey());
                      if (el !== null) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 0);
                  }
                }
              }

              didMoveAny = true;
            }
          }

          // Son sayfa ve doluysa yeni bir boş sayfa ekle
          lastPageNode = pageNode;
          lastPageEl = pageEl;
          lastCapacity = capacity;
          lastUsedScroll = usedScroll;

          page = pageNode.getNextSibling();
        }

        // Son sayfa doluysa yeni bir boş sayfa ekle
        if (
          lastPageNode !== null &&
          lastPageEl !== null &&
          lastUsedScroll > lastCapacity - 2 &&
          lastPageNode.getNextSibling() === null
        ) {
          const newPage = $createPageNode();
          // Header ve footer kopyala
          const prevHeader = lastPageNode.getChildren().find((n) => isHeaderNode(n));
          const prevFooter = lastPageNode.getChildren().find((n) => isFooterNode(n));
          let headerNode = null;
          let footerNode = null;
          if (prevHeader !== null && prevHeader !== undefined) {
            headerNode = new PageHeaderNode(prevHeader.__text ?? '', undefined, prevHeader.__visible ?? false);
            newPage.append(headerNode);
          }
          // Her zaman yeni bir content node ekle
          const contentNode = new PageContentNode();
          newPage.append(contentNode);
          if (prevFooter !== null && prevFooter !== undefined) {
            footerNode = new PageFooterNode(prevFooter.__text ?? '', undefined, prevFooter.__visible ?? false);
            newPage.append(footerNode);
          }
          lastPageNode.insertAfter(newPage);
          // Cursor yeni content'e taşınsın ve scroll yapılsın
          setTimeout(() => {
            const el = editor.getElementByKey(newPage.getKey());
            if (el !== null) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Cursor yeni content'e
            const contentEl = editor.getElementByKey(contentNode.getKey());
            if (contentEl !== null) {
              contentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            editor.update(() => {
              contentNode.selectStart();
            });
          }, 0);
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
