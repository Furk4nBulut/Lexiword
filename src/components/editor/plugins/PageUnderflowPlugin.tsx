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
    let lastContentSizes: number[] = [];

    // Her update'de mevcut content blok sayılarını kaydet
    const updateContentSizes = (): void => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter((n): n is PageNode => $isPageNode(n));
        lastContentSizes = pages.map((page) => {
          const content = page.getChildren().find(isContentNode) as LexicalNode | undefined;
          if (content == null) return 0;
          return content.getChildren().length;
        });
      });
    };

    // İlk mount'ta ve her güncellemede blok sayılarını güncelle
    updateContentSizes();
    const unregisterUpdate = editor.registerUpdateListener(() => {
      updateContentSizes();
    });

    const handler = (): boolean => {
      editor.update(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter((n): n is PageNode => $isPageNode(n));
        // Önceki blok sayılarını al
        const prevSizes = lastContentSizes;
        // Şu anki blok sayılarını al
        const currSizes = pages.map((page) => {
          const content = page.getChildren().find(isContentNode) as LexicalNode | undefined;
          if (content == null) return 0;
          return content.getChildren().length;
        });
        // Her sayfa için, kaç blok silindiğini bul
        for (let i = 0; i < pages.length - 1; i++) {
          const silinen = (prevSizes[i] ?? 0) - (currSizes[i] ?? 0);
          if (silinen > 0) {
            const page = pages[i];
            const nextPage = pages[i + 1];
            const content = page.getChildren().find(isContentNode) as LexicalNode | undefined;
            const nextContent = nextPage.getChildren().find(isContentNode) as
              | LexicalNode
              | undefined;
            if (content == null || nextContent == null) continue;
            const nextBlocks = nextContent.getChildren();
            // Silinen blok kadar yukarı çek
            for (let k = 0; k < silinen && nextBlocks.length > 0; k++) {
              const firstBlock = nextContent.getFirstChild();
              if (firstBlock != null) {
                firstBlock.remove();
                content.append(firstBlock);
              }
            }
          }
        }
        // Son durumda blok sayılarını güncelle
        lastContentSizes = pages.map((page) => {
          const content = page.getChildren().find(isContentNode) as LexicalNode | undefined;
          if (content == null) return 0;
          return content.getChildren().length;
        });
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
      unregisterUpdate();
    };
  }, [editor]);

  return null;
}

export default PageUnderflowPlugin;
