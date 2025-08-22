import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, $setSelection, $createRangeSelection } from 'lexical';
import { isContentNode } from '../nodes/sectionTypeGuards';

import type { ElementNode } from 'lexical';
function getFirstContentNode(): ElementNode | null {
  const rootNode = $getRoot();
  if (rootNode == null) return null;
  for (const pageNode of rootNode.getChildren()) {
    if (typeof pageNode.getChildren === 'function') {
      for (const child of pageNode.getChildren()) {
        if (isContentNode(child)) {
          return child as ElementNode;
        }
      }
    }
  }
  return null;
}

export function CursorFixPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Kopyalama veya toplu silme sonrası imleci başa taşı
    function handleCursorFix(): void {
      editor.update(() => {
        const firstContent = getFirstContentNode();
        if (firstContent !== null) {
          const selection = $createRangeSelection();
          selection.anchor.set(firstContent.getKey(), 0, 'element');
          selection.focus.set(firstContent.getKey(), 0, 'element');
          $setSelection(selection);
        }
      });
    }

    // Kendi eventini dinle (örnek: custom event veya dışarıdan tetiklenebilir)
    window.addEventListener('glyf-cursor-fix', handleCursorFix);

    return () => {
      window.removeEventListener('glyf-cursor-fix', handleCursorFix);
    };
  }, [editor]);

  return null;
}
