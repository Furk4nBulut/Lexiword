import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  SELECTION_CHANGE_COMMAND
} from 'lexical';
import { useEffect, useState, useCallback } from 'react';
import { $createPageBreakNode, $isPageBreakNode, type PageBreakNode } from './PaginationNode';
import { mergeRegister } from '@lexical/utils';

interface PaginationSettings {
  pageHeight: number; // mm
  pageWidth: number; // mm
  marginTop: number; // mm
  marginBottom: number; // mm
  marginLeft: number; // mm
  marginRight: number; // mm
}

const DEFAULT_SETTINGS: PaginationSettings = {
  pageHeight: 297, // A4 height
  pageWidth: 210, // A4 width
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 20,
  marginRight: 20
};

export function PaginationPlugin({
  settings = DEFAULT_SETTINGS,
  onPageCountChange
}: {
  settings?: Partial<PaginationSettings>;
  onPageCountChange?: (pageCount: number) => void;
}): null {
  const [editor] = useLexicalComposerContext();
  const [pageCount, setPageCount] = useState(1);
  const finalSettings = { ...DEFAULT_SETTINGS, ...settings };

  // Calculate available content height per page
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

      // Remove existing page breaks first
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
              // Need a page break before this element
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
        const pageBreak = $createPageBreakNode(pageNumber);
        if (index < root.getChildrenSize()) {
          const nodeAtIndex = root.getChildAtIndex(index);
          if (nodeAtIndex !== null) {
            nodeAtIndex.insertBefore(pageBreak);
          }
        } else {
          root.append(pageBreak);
        }
      });

      // Update page count
      const newPageCount = Math.max(1, currentPageNumber);
      if (newPageCount !== pageCount) {
        setPageCount(newPageCount);
        onPageCountChange?.(newPageCount);
      }
    });
  }, [editor, contentHeight, pageCount, onPageCountChange]);

  const handleCursorMovement = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const pageBreakParent = anchorNode.getParent();

      if ($isPageBreakNode(pageBreakParent)) {
        // Move cursor to the paragraph inside the page break
        const paragraph = pageBreakParent.getFirstChild();
        if (paragraph !== null) {
          selection.anchor.set(paragraph.getKey(), 0, 'element');
          selection.focus.set(paragraph.getKey(), 0, 'element');
        }
      }
    }
  }, []);

  const createNewPageAtCursor = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const insertionNode = selection.anchor.getNode();
        let insertionPoint = insertionNode;

        // Find the appropriate insertion point
        while (insertionPoint.getParent() !== null && insertionPoint.getParent() !== $getRoot()) {
          const parent = insertionPoint.getParent();
          if (parent !== null) {
            insertionPoint = parent;
          } else {
            break;
          }
        }

        // Determine the page number for the new page
        const root = $getRoot();
        const children = root.getChildren();
        let newPageNumber = 1;

        for (const child of children) {
          if ($isPageBreakNode(child)) {
            newPageNumber = Math.max(newPageNumber, child.getPageNumber() + 1);
          }
        }

        // Create new page break
        const newPageBreak = $createPageBreakNode(newPageNumber);
        insertionPoint.insertAfter(newPageBreak);

        // Move cursor to the new page
        const newParagraph = newPageBreak.getFirstChild();
        if (newParagraph !== null) {
          selection.anchor.set(newParagraph.getKey(), 0, 'element');
          selection.focus.set(newParagraph.getKey(), 0, 'element');
        }
      }
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          // Debounce the page break calculation
          setTimeout(() => {
            checkForPageBreak();
          }, 100);
        }
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          handleCursorMovement();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if ((event?.ctrlKey ?? false) || (event?.metaKey ?? false)) {
            // Ctrl/Cmd + Enter creates a new page
            createNewPageAtCursor();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => {
          handleCursorMovement();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => {
          handleCursorMovement();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, checkForPageBreak, handleCursorMovement, createNewPageAtCursor]);

  // Initial page break calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForPageBreak();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [checkForPageBreak]);

  return null;
}

export { DEFAULT_SETTINGS as defaultPaginationSettings };
export type { PaginationSettings };
