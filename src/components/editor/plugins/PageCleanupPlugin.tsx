import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { PageNode, $isPageNode } from '../nodes/PageNode';
import { PageHeaderNode } from '../nodes/PageHeaderNode';
import { PageFooterNode } from '../nodes/PageFooterNode';
import { PageContentNode } from '../nodes/PageContentNode';
import { serializeSectionChildren, importSerializedNode } from '../utils/headerFooterUtils';
import { useEffect } from 'react';

/**
 * PageCleanupPlugin
 *
 * (Türkçe) Editör içerisindeki page node'larının temizlik kurallarını
 * uygular: tamamen boş sayfaları kaldırır, en az bir sayfanın kalmasını
 * garanti eder ve silinen sayfaların header/footer içeriğini ihtiyaç
 * halinde kalan sayfalara taşır.
 */
export function PageCleanupPlugin(): null {
  // Lexical editörün context'ine erişiyoruz (editor instance).
  const [editor] = useLexicalComposerContext();

  /**
   * useEffect hook'u, editor güncellendiğinde (örn. kullanıcı yazı yazdığında,
   * sayfa eklediğinde veya sildiğinde) tetiklenecek bir "update listener" kaydeder.
   *
   * registerUpdateListener → her editor güncellemesinde çalışır.
   */
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      // Editor state güncelleme bloğu
      editor.update(() => {
        // Root (ana container) node'u alıyoruz.
        const root = $getRoot();

        // Root içindeki tüm PageNode'ları alıyoruz.
        const pages = root.getChildren().filter($isPageNode);

        /**
         * Eğer hiç PageNode kalmamışsa:
         * - Yeni bir PageNode oluştur
         * - İçine header, content ve footer ekle
         * - Root'a ekle
         */
        if (pages.length === 0) {
          const newPage = new PageNode({});
          newPage.append(new PageHeaderNode());
          newPage.append(new PageContentNode());
          newPage.append(new PageFooterNode());
          root.append(newPage);
          return;
        }

        // Eğer sadece 1 sayfa varsa → onu silme, çünkü en az bir sayfa kalmalı
        if (pages.length === 1) {
          // Son kalan sayfanın page number'ını güncelle
          const onlyPage = pages[0];
          const updatePageNumberToOne = (
            node:
              | {
                  getChildren?: () => any[];
                  getType?: () => string;
                  setTextContent?: (text: string) => void;
                }
              | null
              | undefined
          ): void => {
            if (node == null || typeof node.getChildren !== 'function') return;
            const children = node.getChildren();
            for (const child of children) {
              if (typeof child.getType === 'function' && child.getType() === 'page-number') {
                if (typeof child.setTextContent === 'function') {
                  child.setTextContent('1');
                }
              }
              if (typeof child.getChildren === 'function') {
                updatePageNumberToOne(child);
              }
            }
          };
          updatePageNumberToOne(onlyPage.getHeaderNode?.());
          updatePageNumberToOne(onlyPage.getFooterNode?.());
          return;
        }

        /**
         * Boş içerikli sayfaları buluyoruz.
         * Yani page-content node'u varsa ve içinde hiç child yoksa → boş sayfa kabul edilir.
         */
        const pagesToRemove = pages.filter((pageNode) => {
          const contentNode = pageNode.getChildren().find((c) => c.getType() === 'page-content');
          return (
            contentNode !== undefined && contentNode !== null && contentNode.getChildrenSize() === 0
          );
        });

        // Eğer silinecek sayfa yoksa → direkt çık
        if (pagesToRemove.length === 0) return;

        /**
         * Geriye en az 1 sayfa kalmasını garanti etmek için:
         * - Silinecek sayfalar dışındakileri bul
         * - Eğer sadece 1 tane kalıyorsa → onu "kalan sayfa" olarak işaretle
         */
        const remainingPages = pages.filter((p) => !pagesToRemove.includes(p));
        const remainingPage = remainingPages.length === 1 ? remainingPages[0] : null;

        /**
         * Eğer sadece 1 sayfa kalıyorsa ve silinecek sayfa sadece 1 tane ise:
         * - Silinecek sayfanın header/footer içeriğini al
         * - Eğer kalan sayfanın header/footer'ı boşsa → bu içerikleri kopyala
         */
        if (remainingPage != null && pagesToRemove.length === 1) {
          const removedPage = pagesToRemove[0];

          /**
           * HEADER KOPYALAMA
           */
          const removedHeader = removedPage.getHeaderNode();
          const remainingHeader = remainingPage.getHeaderNode();

          if (removedHeader != null && remainingHeader != null) {
            const removedHeaderChildren = removedHeader.getChildren();
            const remainingHeaderChildren = remainingHeader.getChildren();

            // Silinen sayfanın header'ında içerik var mı?
            const removedHeaderHasContent =
              removedHeaderChildren.length > 0 &&
              removedHeaderChildren.some(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() !== ''
              );

            // Kalan sayfanın header'ı boş mu?
            const remainingHeaderIsEmpty =
              remainingHeaderChildren.length === 0 ||
              remainingHeaderChildren.every(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() === ''
              );

            // Eğer silinen header dolu, kalan header boş → kopyala (utils kullanarak)
            if (removedHeaderHasContent && remainingHeaderIsEmpty) {
              remainingHeader.clear();
              const refHeaderJSON = serializeSectionChildren(removedHeader);
              if (Array.isArray(refHeaderJSON)) {
                refHeaderJSON.forEach((childJSON) => {
                  const imported = importSerializedNode(childJSON);
                  if (imported != null) remainingHeader.append(imported);
                });
              }
            }
          }

          /**
           * FOOTER KOPYALAMA
           * (Header ile aynı mantıkta çalışır)
           */
          const removedFooter = removedPage.getFooterNode();
          const remainingFooter = remainingPage.getFooterNode();

          if (removedFooter != null && remainingFooter != null) {
            const removedFooterChildren = removedFooter.getChildren();
            const remainingFooterChildren = remainingFooter.getChildren();

            const removedFooterHasContent =
              removedFooterChildren.length > 0 &&
              removedFooterChildren.some(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() !== ''
              );

            const remainingFooterIsEmpty =
              remainingFooterChildren.length === 0 ||
              remainingFooterChildren.every(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() === ''
              );

            if (removedFooterHasContent && remainingFooterIsEmpty) {
              remainingFooter.clear();
              const refFooterJSON = serializeSectionChildren(removedFooter);
              if (Array.isArray(refFooterJSON)) {
                refFooterJSON.forEach((childJSON) => {
                  const imported = importSerializedNode(childJSON);
                  if (imported != null) remainingFooter.append(imported);
                });
              }
            }
          }
        }

        /**
         * Son adım: Silinecek sayfaları gerçekten DOM'dan kaldır.
         */
        pagesToRemove.forEach((pageNode) => {
          pageNode.remove();
        });
      });
    });
  }, [editor]);

  // Plugin React bileşeni olduğu için null döner → sadece side-effect çalıştırır
  return null;
}

// Default export
export default PageCleanupPlugin;
