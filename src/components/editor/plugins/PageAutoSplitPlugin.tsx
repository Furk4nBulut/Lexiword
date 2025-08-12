import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $isTextNode,
  $createTextNode,
  $createParagraphNode
} from 'lexical';
import type { ElementNode as LexicalElementNode } from 'lexical';
import { $createPageNode, $isPageNode } from '../nodes/PageNode';
import { isContentNode } from '../nodes/sectionTypeGuards';
import type { PageContentNode } from '../nodes/PageContentNode';
import type { PageNode } from '../nodes/PageNode';

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
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // --- PAGE REFLOW LOGIC ---
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
  const contentEl = pageEl.querySelector('[data-lexical-page-section="content"]');
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
        const hasNonPage = children.some((n) => n != null && !$isPageNode(n));
        if (hasNonPage) {
          const page = $createPageNode();
          children.forEach((n) => {
            if (n != null && !$isPageNode(n)) {
              const contentSection = page.getChildren().find((c: any): c is PageContentNode => isContentNode(c));
              if (contentSection != null) contentSection.append(n);
            }
          });
          root.append(page);
        }

  let page = root.getFirstChild();
  while (page != null && $isPageNode(page)) {
          const pageNode = page;
          const pageEl = getPageEl(pageNode);
          if (pageEl == null) {
            page = pageNode.getNextSibling();
            continue;
          }
          if (pageEl.clientHeight === 0 || pageEl.scrollHeight === 0) {
            page = pageNode.getNextSibling();
            continue;
          }

          const { el: contentDomEl, height: capacity, top: contentTop, paddingTop, paddingBottom } =
            getContentMetrics(pageEl);
          const contentSection = pageNode.getChildren().find((n: any): n is PageContentNode => isContentNode(n));
          const blocks = (contentSection?.getChildren() ?? []) as LexicalElementNode[];

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

          const tolDeepest = 1;
          const tolSum = 6;
          const scrollTol = 2;
          const overflow =
            (usedDeepest > capacity - tolDeepest && usedSum > capacity - tolSum) ||
            usedScroll > capacity + scrollTol;

          if (overflow) {
            const candidate = pickMovableBlock(blocks);
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
                    if (nextPage == null || !$isPageNode(nextPage)) {
                      nextPage = $createPageNode();
                      pageNode.insertAfter(nextPage);
                    }
                    const nextContent = nextPage.getChildren().find((n: any): n is PageContentNode => isContentNode(n));
                    if (nextContent != null) nextContent.append(candidate);
                  }
                }
              } else {
                let nextPage = pageNode.getNextSibling();
                if (nextPage == null || !$isPageNode(nextPage)) {
                  nextPage = $createPageNode();
                  pageNode.insertAfter(nextPage);
                }
                const nextContent = nextPage.getChildren().find((n: any): n is PageContentNode => isContentNode(n));
                if (nextContent != null) nextContent.append(candidate);
              }

              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const next = pageNode.getNextSibling();
                if (next != null && $isPageNode(next)) {
                  const nextContent = next.getChildren().find((n: any): n is PageContentNode => isContentNode(n));
                  const firstChild = nextContent?.getFirstChild() ?? null;
                  if (firstChild != null) firstChild.selectStart();
                }
              }

              didMoveAny = true;
            }
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

    // --- INTERSECTION OBSERVER LOGIC ---
    function setupObserver(): void {
      observerRef.current?.disconnect();

      const rootElement = editor.getRootElement();
      if (rootElement === null) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              const pageElement = target.closest('[data-lexical-node-key]');

              editor.update(() => {
                const root = $getRoot();

                if (pageElement !== null) {
                  const key = pageElement.getAttribute('data-lexical-node-key');
                  if (key == null || key === '') return;
                  const node = $getNodeByKey(key);
                  if (node != null && $isPageNode(node)) {
                    const nextSibling = node.getNextSibling();
                    if (nextSibling == null || !$isPageNode(nextSibling)) {
                      const newPage = $createPageNode();
                      node.insertAfter(newPage);
                      const content = newPage.getChildren().find((n: any): n is PageContentNode => isContentNode(n));
                      const firstChild = content?.getFirstChild();
                      if (firstChild != null) firstChild.selectStart();
                    }
                  }
                } else {
                  const lastChild = root.getLastChild();
                  if (lastChild == null || !$isPageNode(lastChild)) {
                    const newPage = $createPageNode();
                    root.append(newPage);
                  }
                }
              });
            }
          }
        },
        { root: null, threshold: 1.0, rootMargin: '0px 0px 200px 0px' }
      );

      observerRef.current = observer;

      const sentinels = rootElement.querySelectorAll('.page-observer-target');
      sentinels.forEach((el) => {
        observer.observe(el);
      });
    }

  requestAnimationFrame(setupObserver);

    const unregisterObs = editor.registerUpdateListener(() => {
      setTimeout(setupObserver, 0);
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      unregister();
      unregisterObs();
      observerRef.current?.disconnect();
      observerRef.current = null;
      isReflowingRef.current = false;
    };
  }, [editor, pageHeightMm, marginTopMm, marginBottomMm]);

  return null;
}
