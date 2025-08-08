import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  ElementNode as LexicalElementNode,
  $isTextNode,
  $createTextNode,
  $createParagraphNode
} from 'lexical';
import { $createPageNode, $isPageNode, PageNode } from './PageNode';

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export interface PageFlowSettings {
  pageHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
}

export function usePageFlow(settings: PageFlowSettings): void {
  const [editor] = useLexicalComposerContext();
  const rafRef = useRef<number | null>(null);
  const isReflowingRef = useRef(false);
  const unbreakableTooTallKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    function getPageEl(page: PageNode): HTMLElement | null {
      return editor.getElementByKey(page.getKey());
    }

    function getCapacityPx(pageEl: HTMLElement): number {
      const styles = window.getComputedStyle(pageEl);
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;
      return pageEl.clientHeight - paddingTop - paddingBottom;
    }

    function getBlockOuterHeightPx(block: LexicalElementNode): number {
      const el = editor.getElementByKey(block.getKey());
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      const mt = parseFloat(styles.marginTop) || 0;
      const mb = parseFloat(styles.marginBottom) || 0;
      return rect.height + mt + mb;
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

    function reflowPass(): boolean {
      let didMoveAny = false;

      editor.update(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }

        // Ensure only PageNodes under root
        const children = root.getChildren();
        const hasNonPage = children.some((n) => !$isPageNode(n));
        if (hasNonPage) {
          const page = $createPageNode();
          children.forEach((n) => {
            if (!$isPageNode(n)) page.append(n);
          });
          root.append(page);
        }

        let page = root.getFirstChild();
        while ($isPageNode(page)) {
          const pageNode = page as PageNode;
          const pageEl = getPageEl(pageNode);
          if (!pageEl) {
            page = pageNode.getNextSibling();
            continue;
          }

          const ch = pageEl.clientHeight;
          const sh = pageEl.scrollHeight;
          if (ch === 0 || sh === 0) {
            page = pageNode.getNextSibling();
            continue;
          }

          const capacity = getCapacityPx(pageEl);
          const blocks = pageNode.getChildren();
          let used = 0;
          for (let i = 0; i < blocks.length; i++) {
            used += getBlockOuterHeightPx(blocks[i] as LexicalElementNode);
            if (used > capacity) break;
          }

          if (used > capacity) {
            if (blocks.length > 0) {
              const lastBlock = blocks[blocks.length - 1] as LexicalElementNode;
              const lastEl = editor.getElementByKey(lastBlock.getKey());

              if (blocks.length === 1 && lastEl) {
                const currentH = getBlockOuterHeightPx(lastBlock);
                const key = lastBlock.getKey();
                if (!unbreakableTooTallKeysRef.current.has(key)) {
                  const ok = proportionalSplitParagraphByHeight(lastBlock, currentH, capacity);
                  if (!ok) {
                    unbreakableTooTallKeysRef.current.add(key);
                    let nextPage = pageNode.getNextSibling();
                    if (!$isPageNode(nextPage)) {
                      nextPage = $createPageNode();
                      pageNode.insertAfter(nextPage);
                    }
                    (nextPage as PageNode).append(lastBlock);
                  }
                }
              } else {
                // Move only the last block to the next page
                let nextPage = pageNode.getNextSibling();
                if (!$isPageNode(nextPage)) {
                  nextPage = $createPageNode();
                  pageNode.insertAfter(nextPage);
                }
                (nextPage as PageNode).append(lastBlock);
              }

              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const next = pageNode.getNextSibling();
                if ($isPageNode(next)) {
                  const firstChild = (next as PageNode).getFirstChild();
                  if (firstChild) firstChild.selectStart();
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
        const run = () => {
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

    const unregister = editor.registerUpdateListener(() => {
      schedule();
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      unregister();
      isReflowingRef.current = false;
    };
  }, [editor, settings.pageHeightMm, settings.marginTopMm, settings.marginBottomMm]);
}
