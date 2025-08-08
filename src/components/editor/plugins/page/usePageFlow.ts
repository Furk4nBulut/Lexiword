import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, ElementNode as LexicalElementNode } from 'lexical';
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

  useEffect(() => {
    const contentHeightPx = mmToPx(
      settings.pageHeightMm - settings.marginTopMm - settings.marginBottomMm
    );

    function reflowPass(): boolean {
      let didMoveAny = false;

      editor.update(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }

        // Ensure root contains only PageNodes. If not, wrap remaining into a PageNode at the end.
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
          const blocks = pageNode.getChildren();

          // Measure used height until overflow
          let used = 0;
          let overflowIndex: number | null = null;
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i] as LexicalElementNode;
            const el = editor.getElementByKey(block.getKey());
            if (!el) {
              continue; // DOM not ready yet
            }
            const h = el.offsetHeight;

            // If a single block itself exceeds content height, leave it on the page (can't split)
            if (h > contentHeightPx && i === 0) {
              overflowIndex = null;
              used = h;
              break;
            }

            if (used + h > contentHeightPx) {
              overflowIndex = i;
              break;
            }
            used += h;
          }

          if (overflowIndex !== null) {
            let nextPage = pageNode.getNextSibling();
            if (!$isPageNode(nextPage)) {
              nextPage = $createPageNode();
              pageNode.insertAfter(nextPage);

              // Move caret to the start of the new page's first block if selection was at the end
              const selection = $getSelection();
              const firstChild = (nextPage as PageNode).getFirstChild();
              if ($isRangeSelection(selection) && firstChild) {
                firstChild.selectStart();
              }
            }

            const toMove = blocks.slice(overflowIndex);
            toMove.forEach((n) => {
              (nextPage as PageNode).append(n);
            });

            didMoveAny = true;
            // Continue checking the new page in this pass
            page = nextPage;
            continue;
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
        // Run reflow passes until stable or a small cap (to avoid infinite loops)
        let passes = 0;
        const maxPasses = 10;
        const run = () => {
          const moved = reflowPass();
          passes++;
          if (moved && passes < maxPasses) {
            // Allow DOM to settle minimally
            setTimeout(run, 0);
          } else {
            isReflowingRef.current = false;
          }
        };
        // Kick off first pass after minimal delay to ensure DOM is ready
        setTimeout(run, 0);
      });
    };

    // Initial run
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