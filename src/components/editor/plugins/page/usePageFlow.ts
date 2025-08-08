import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
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

  useEffect(() => {
    function ensureNextPageWhenFull(): void {
      editor.update(() => {
        const root = $getRoot();
        if (root.getChildrenSize() === 0) {
          root.append($createPageNode());
          return;
        }

        let last = root.getLastChild();
        if (!$isPageNode(last)) {
          const page = $createPageNode();
          const children = root.getChildren();
          children.forEach((n) => {
            if (!$isPageNode(n)) page.append(n);
          });
          root.append(page);
          last = page;
        }

        const lastPage = last as PageNode;
        const contentHeightPx = mmToPx(
          settings.pageHeightMm - settings.marginTopMm - settings.marginBottomMm
        );

        let usedPx = 0;
        const blocks = lastPage.getChildren();
        for (let i = 0; i < blocks.length; i++) {
          const el = editor.getElementByKey(blocks[i].getKey());
          if (!el) continue;
          usedPx += el.offsetHeight;
        }

        if (usedPx >= contentHeightPx - 4) {
          const next = lastPage.getNextSibling();
          if (!$isPageNode(next)) {
            const newPage = $createPageNode();
            lastPage.insertAfter(newPage);
            const firstChild = newPage.getFirstChild();
            const selection = $getSelection();
            if ($isRangeSelection(selection) && firstChild) {
              firstChild.selectStart();
            }
          }
        }
      });
    }

    const schedule = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(ensureNextPageWhenFull, 0);
      });
    };

    schedule();

    const unregister = editor.registerUpdateListener(() => {
      schedule();
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      unregister();
    };
  }, [editor, settings.pageHeightMm, settings.marginTopMm, settings.marginBottomMm]);
} 