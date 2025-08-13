import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { PageNode } from '../nodes/PageNode';

/**
 * PageInitializerPlugin
 *
 * Editör ilk açıldığında veya root node boşsa, otomatik olarak bir PageNode ekler.
 * Bu PageNode'un içine header, content ve footer bölümleri de eklenir (header/footer varsayılan olarak gizli).
 *
 * Kullanım Senaryosu:
 * - Editör ilk açıldığında, kullanıcıya boş bir sayfa sunmak için kullanılır.
 *
 * Notlar:
 * - page.appendInitialChildren fonksiyonu ile header/footer/content otomatik eklenir.
 */
export function PageInitializerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Editör açıldığında veya root boşsa, bir PageNode ekle
    editor.update(() => {
      const root = $getRoot();
      if (root.getChildrenSize() === 0) {
        const page = new PageNode({});
        page.appendInitialChildren(); // Always add header/footer/content (header/footer hidden by default)
        root.append(page);
      }
    });
  }, [editor]);

  return null;
}
