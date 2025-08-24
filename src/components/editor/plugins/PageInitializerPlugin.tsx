import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { PageNode } from '../nodes/PageNode';
import { PageContentNode } from '../nodes/PageContentNode';
import { serializeSectionChildren, importSerializedNode } from '../utils/headerFooterUtils';

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
        // Eğer header varsa kopyala (serialize -> import yaklaşımı)
        if (typeof headerToCopy !== 'undefined' && headerToCopy !== null) {
          const refHeaderJSON = serializeSectionChildren(headerToCopy);
          if (Array.isArray(refHeaderJSON)) {
            const headerClone = headerToCopy.clone();
            refHeaderJSON.forEach((childJSON) => {
              const imported = importSerializedNode(childJSON);
              if (imported != null && typeof headerClone.append === 'function')
                headerClone.append(imported);
            });
            page.append(headerClone);
            console.log('[PageInitializerPlugin] Header cloned and appended (via JSON import)');
          }
        }
        page.append(new PageContentNode());
        console.log('[PageInitializerPlugin] PageContentNode appended');
        // Eğer footer varsa kopyala (serialize -> import yaklaşımı)
        if (typeof footerToCopy !== 'undefined' && footerToCopy !== null) {
          const refFooterJSON = serializeSectionChildren(footerToCopy);
          if (Array.isArray(refFooterJSON)) {
            const footerClone = footerToCopy.clone();
            refFooterJSON.forEach((childJSON) => {
              const imported = importSerializedNode(childJSON);
              if (imported != null && typeof footerClone.append === 'function')
                footerClone.append(imported);
            });
            page.append(footerClone);
            console.log('[PageInitializerPlugin] Footer cloned and appended (via JSON import)');
          }
        }
        root.append(page);
        console.log('[PageInitializerPlugin] New PageNode appended to root:', page);
      }
    });
  }, [editor]);

  return null;
}
