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
      console.log('[PageInitializerPlugin] Root children size:', root.getChildrenSize());
      if (root.getChildrenSize() === 0) {
        const page = new PageNode({});
        console.log('[PageInitializerPlugin] Root is empty, creating new PageNode');
        // Eğer root'ta başka PageNode varsa ve onların header/footer'ı varsa, yeni sayfaya da ekle
        let headerToCopy: any;
        let footerToCopy: any;
        // root.getChildren() boş ama yine de güvenli olsun diye kontrol
        // (ileride root'a başka node eklenirse)
        const otherPages = root
          .getChildren()
          .filter((n) => typeof n.getType === 'function' && n.getType() === 'page');
        console.log('[PageInitializerPlugin] Other pages found:', otherPages.length);
        if (otherPages.length > 0) {
          const firstPage = otherPages[0];
          if (typeof firstPage.getHeaderNode === 'function') {
            headerToCopy = firstPage.getHeaderNode();
            console.log('[PageInitializerPlugin] Copying header from first page:', headerToCopy);
          }
          if (typeof firstPage.getFooterNode === 'function') {
            footerToCopy = firstPage.getFooterNode();
            console.log('[PageInitializerPlugin] Copying footer from first page:', footerToCopy);
          }
        }
        // Eğer header varsa kopyala
        if (typeof headerToCopy !== 'undefined' && headerToCopy !== null) {
          const headerClone = headerToCopy.clone();
          headerToCopy.getChildren().forEach((child: any) => {
            if (typeof child.clone === 'function') headerClone.append(child.clone());
          });
          page.append(headerClone);
          console.log('[PageInitializerPlugin] Header cloned and appended');
        }
        page.append(new PageContentNode());
        console.log('[PageInitializerPlugin] PageContentNode appended');
        // Eğer footer varsa kopyala
        if (typeof footerToCopy !== 'undefined' && footerToCopy !== null) {
          const footerClone = footerToCopy.clone();
          footerToCopy.getChildren().forEach((child: any) => {
            if (typeof child.clone === 'function') footerClone.append(child.clone());
          });
          page.append(footerClone);
          console.log('[PageInitializerPlugin] Footer cloned and appended');
        }
        root.append(page);
        console.log('[PageInitializerPlugin] New PageNode appended to root:', page);
      }
    });
  }, [editor]);

  return null;
}
