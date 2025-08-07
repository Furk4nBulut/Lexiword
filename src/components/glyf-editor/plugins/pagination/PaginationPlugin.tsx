import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect, useCallback } from 'react';
import { $createPageBreakNode, $isPageBreakNode, type PageBreakNode } from './PageBreakNode';
import { type PaginationSettings, DEFAULT_PAGINATION_SETTINGS } from './PaginationSettings';

export function PaginationPlugin({
  settings = DEFAULT_PAGINATION_SETTINGS,
  onPageCountChange
}: {
  settings?: Partial<PaginationSettings>;
  onPageCountChange?: (pageCount: number) => void;
}): null {
  const [editor] = useLexicalComposerContext();
  const finalSettings = { ...DEFAULT_PAGINATION_SETTINGS, ...settings };
  const contentHeight =
    finalSettings.pageHeight - finalSettings.marginTop - finalSettings.marginBottom;

  const checkForPageBreak = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();
      let currentPageHeight = 0;
      let currentPageNumber = 1;
      const pageBreaksToAdd: Array<{ index: number; pageNumber: number }> = [];
      const existingPageBreaks: PageBreakNode[] = [];

      // Collect existing page breaks
      children.forEach((child) => {
        if ($isPageBreakNode(child)) {
          existingPageBreaks.push(child);
        }
      });

      // Remove all existing page breaks
      existingPageBreaks.forEach((pageBreak) => {
        pageBreak.remove();
      });

      // Recalculate page breaks
      const updatedChildren = root.getChildren();
      updatedChildren.forEach((child, index) => {
        if (!$isPageBreakNode(child)) {
          const element = editor.getElementByKey(child.getKey());
          if (element !== null) {
            const elementHeight = element.offsetHeight;
            const elementHeightMm = (elementHeight * 25.4) / 96; // Convert px to mm

            if (currentPageHeight + elementHeightMm > contentHeight) {
              pageBreaksToAdd.push({ index, pageNumber: currentPageNumber + 1 });
              currentPageNumber++;
              currentPageHeight = elementHeightMm;
            } else {
              currentPageHeight += elementHeightMm;
            }
          }
        }
      });

      // Add page breaks
      pageBreaksToAdd.reverse().forEach(({ index, pageNumber }) => {
        const nodeAtIndex = root.getChildAtIndex(index);
        if (nodeAtIndex !== null) {
          const pageBreak = $createPageBreakNode(pageNumber);
          nodeAtIndex.insertBefore(pageBreak);
        }
      });

      // Update page count
      const newPageCount = Math.max(1, currentPageNumber);
      onPageCountChange?.(newPageCount);
    });
  }, [editor, contentHeight, onPageCountChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkForPageBreak();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [checkForPageBreak]);

  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        setTimeout(() => {
          checkForPageBreak();
        }, 100);
      }
    });
  }, [editor, checkForPageBreak]);

  return null;
}
