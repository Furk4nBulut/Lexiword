import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { PageNode } from '../nodes/PageNode';
import { PageContentNode } from '../nodes/PageContentNode';

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
        // Eğer root'ta başka PageNode varsa ve onların header/footer'ı varsa, yeni sayfaya da ekle
  let headerToCopy: any;
  let footerToCopy: any;
        // root.getChildren() boş ama yine de güvenli olsun diye kontrol
        // (ileride root'a başka node eklenirse)
        const otherPages = root.getChildren().filter((n) => typeof n.getType === 'function' && n.getType() === 'page');
        if (otherPages.length > 0) {
          const firstPage = otherPages[0];
          if (typeof firstPage.getHeaderNode === 'function') headerToCopy = firstPage.getHeaderNode();
          if (typeof firstPage.getFooterNode === 'function') footerToCopy = firstPage.getFooterNode();
        }
        // Eğer header varsa kopyala
        if (typeof headerToCopy !== 'undefined' && headerToCopy !== null) {
          const headerClone = headerToCopy.clone();
          headerToCopy.getChildren().forEach((child: any) => {
            if (typeof child.clone === 'function') headerClone.append(child.clone());
          });
          page.append(headerClone);
        }
        page.append(new PageContentNode());
        // Eğer footer varsa kopyala
        if (typeof footerToCopy !== 'undefined' && footerToCopy !== null) {
          const footerClone = footerToCopy.clone();
          footerToCopy.getChildren().forEach((child: any) => {
            if (typeof child.clone === 'function') footerClone.append(child.clone());
          });
          page.append(footerClone);
        }
        root.append(page);
      }
    });
  }, [editor]);

  return null;
}
