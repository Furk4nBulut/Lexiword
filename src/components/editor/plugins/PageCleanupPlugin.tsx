import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'; // Lexical context hook'u
import { $getRoot } from 'lexical'; // Lexical kök node fonksiyonu
import { PageNode, $isPageNode } from '../nodes/PageNode'; // Page node tipleri
import { PageHeaderNode } from '../nodes/PageHeaderNode'; // Header node
import { PageFooterNode } from '../nodes/PageFooterNode'; // Footer node
import { PageContentNode } from '../nodes/PageContentNode'; // Content node
import { serializeSectionChildren, importSerializedNode } from '../utils/headerFooterUtils'; // Header/footer utils
import { useEffect } from 'react'; // React hook

/**
 * PageCleanupPlugin
 *
 * Editör içerisindeki page node'larının temizlik kurallarını uygular:
 * - Tamamen boş sayfaları kaldırır
 * - En az bir sayfanın kalmasını garanti eder
 * - Silinen sayfaların header/footer içeriğini ihtiyaç halinde kalan sayfalara taşır
 *
 * @returns null (sadece yan etki için)
 */
export function PageCleanupPlugin(): null {
  // Lexical editörün context'ine erişiyoruz (editor instance).
  const [editor] = useLexicalComposerContext(); // Editor instance'ı

  /**
   * useEffect hook'u, editor güncellendiğinde (örn. kullanıcı yazı yazdığında,
   * sayfa eklediğinde veya sildiğinde) tetiklenecek bir "update listener" kaydeder.
   *
   * registerUpdateListener → her editor güncellemesinde çalışır.
   */
  useEffect(() => {
    // Editor güncellenince tetiklenecek listener kaydı
    return editor.registerUpdateListener(() => {
      // Editor state güncelleme bloğu
      editor.update(() => {
        const root = $getRoot(); // Kök node'u al
        const pages = root.getChildren().filter($isPageNode); // Tüm page node'larını al

        // Hiç sayfa yoksa yeni bir tane oluştur
        if (pages.length === 0) {
          const newPage = new PageNode({}); // Yeni page node
          newPage.append(new PageHeaderNode()); // Header ekle
          newPage.append(new PageContentNode()); // Content ekle
          newPage.append(new PageFooterNode()); // Footer ekle
          root.append(newPage); // Root'a ekle
          return;
        }

        // Sadece 1 sayfa varsa onu silme, en az bir sayfa kalmalı
        if (pages.length === 1) {
          const onlyPage = pages[0]; // Tek sayfa
          // Header/footer içindeki page-number'ı 1 yap
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
            if (node == null || typeof node.getChildren !== 'function') return; // Yoksa çık
            const children = node.getChildren(); // Çocukları al
            for (const child of children) {
              if (typeof child.getType === 'function' && child.getType() === 'page-number') {
                if (typeof child.setTextContent === 'function') {
                  child.setTextContent('1'); // Page number'ı 1 yap
                }
              }
              if (typeof child.getChildren === 'function') {
                updatePageNumberToOne(child); // Alt node'larda da uygula
              }
            }
          };
          updatePageNumberToOne(onlyPage.getHeaderNode?.()); // Header için uygula
          updatePageNumberToOne(onlyPage.getFooterNode?.()); // Footer için uygula
          return;
        }

        // Boş içerikli sayfaları bul (content'i boş olanlar)
        const pagesToRemove = pages.filter((pageNode) => {
          const contentNode = pageNode.getChildren().find((c) => c.getType() === 'page-content');
          return (
            contentNode !== undefined && contentNode !== null && contentNode.getChildrenSize() === 0
          );
        });

        // Silinecek sayfa yoksa çık
        if (pagesToRemove.length === 0) return;

        // Geriye en az 1 sayfa kalmasını garanti et
        const remainingPages = pages.filter((p) => !pagesToRemove.includes(p)); // Kalanlar
        const remainingPage = remainingPages.length === 1 ? remainingPages[0] : null; // Tek kalan varsa

        // Eğer sadece 1 sayfa kalıyorsa ve silinecek sayfa sadece 1 ise, header/footer kopyala
        if (remainingPage != null && pagesToRemove.length === 1) {
          const removedPage = pagesToRemove[0]; // Silinecek sayfa

          // HEADER KOPYALAMA
          const removedHeader = removedPage.getHeaderNode(); // Silinenin header'ı
          const remainingHeader = remainingPage.getHeaderNode(); // Kalanın header'ı

          if (removedHeader != null && remainingHeader != null) {
            const removedHeaderChildren = removedHeader.getChildren();
            const remainingHeaderChildren = remainingHeader.getChildren();

            // Silinen header'da içerik var mı?
            const removedHeaderHasContent =
              removedHeaderChildren.length > 0 &&
              removedHeaderChildren.some(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() !== ''
              );

            // Kalan header boş mu?
            const remainingHeaderIsEmpty =
              remainingHeaderChildren.length === 0 ||
              remainingHeaderChildren.every(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() === ''
              );

            // Silinen header dolu, kalan header boşsa kopyala
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

          // FOOTER KOPYALAMA (header ile aynı mantık)
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

        // Son adım: Silinecek sayfaları DOM'dan kaldır
        pagesToRemove.forEach((pageNode) => {
          pageNode.remove(); // Sayfayı sil
        });
      });
    });
  }, [editor]);

  // Plugin React bileşeni olduğu için null döner → sadece yan etki çalıştırır
  return null;
}

// Default export
export default PageCleanupPlugin;
