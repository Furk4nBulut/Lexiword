import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { $isPageNode } from '../nodes/PageNode';

/**
 * PageCleanupPlugin
 *
 * İçeriği tamamen boş olan PageNode'ları otomatik olarak siler.
 * En az bir sayfa kalmasını garanti eder.
 */
export function PageCleanupPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter($isPageNode);
        if (pages.length <= 1) return; // En az bir sayfa kalsın
        pages.forEach((pageNode) => {
          const contentNode = pageNode.getChildren().find((c) => c.getType() === 'page-content');
          if (
            contentNode !== undefined &&
            contentNode !== null &&
            contentNode.getChildrenSize() === 0 // İçerik tamamen boşsa
          ) {
            pageNode.remove();
          }
        });
      });
    });
  }, [editor]);

  return null;
}
