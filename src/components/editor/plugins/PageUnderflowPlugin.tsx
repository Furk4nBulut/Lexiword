import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $getRoot,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type LexicalNode
} from 'lexical';
import { $isPageNode, type PageNode } from '../nodes/PageNode';
import { isContentNode } from '../nodes/sectionTypeGuards';
import { getSelectedContentBlockCount, pullBlocksUp } from '../utils/underflowUtils';

/**
 * PageUnderflowPlugin
 *
 * Backspace ile içerik silindiğinde, bir önceki sayfanın kapasitesi uygunsa
 * bir sonraki sayfanın ilk bloğunu yukarıya çeker. Böylece sayfalar arası
 * içerik akışı yukarı doğru olur.
 */
export function PageUnderflowPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Backspace ve Delete komutlarını dinle
    const handler = (): boolean => {
      editor.update(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter((n): n is PageNode => $isPageNode(n));
        // Seçili blok sayısını helper ile hesapla
        const selectedBlockCount = getSelectedContentBlockCount(editor);
        for (let i = 0; i < pages.length - 1; i++) {
          const page = pages[i];
          const nextPage = pages[i + 1];
          // Her iki sayfanın content node'unu bul
          const content = page.getChildren().find(isContentNode) as LexicalNode | undefined;
          const nextContent = nextPage.getChildren().find(isContentNode) as LexicalNode | undefined;
          if (content == null || nextContent == null) continue;
          const blocks = content.getChildren();
          const nextBlocks = nextContent.getChildren();
          // Eğer bu sayfanın content'i kapasitesinin çok altındaysa ve sonraki sayfada blok varsa
          if (blocks.length > 0 && nextBlocks.length > 0) {
            // Seçili blok sayısı kadar bloğu aşağıdan yukarıya çek (helper)
            const moveCount = Math.min(selectedBlockCount, nextBlocks.length);
            pullBlocksUp(content, nextContent, moveCount);
          }
        }
      });
      // Komutun işlenmesini engelleme, normal backspace/delete devam etsin
      return false;
    };
    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handler,
      COMMAND_PRIORITY_LOW
    );
    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      handler,
      COMMAND_PRIORITY_LOW
    );
    return () => {
      unregisterBackspace();
      unregisterDelete();
    };
  }, [editor]);

  return null;
}

export default PageUnderflowPlugin;
