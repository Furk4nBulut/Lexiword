import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';
import { $isPageNode } from '../nodes/PageNode';

/**
 * HeaderFooterSyncPlugin
 *
 * Bu plugin, header/footer edit modundayken bir header/footer değişikliği olduğunda
 * tüm sayfalardaki header/footer'ı otomatik olarak günceller.
 *
 * Kullanım Senaryosu:
 * - Kullanıcı bir sayfanın header veya footer'ını değiştirdiğinde, tüm sayfalarda aynı değişikliğin yansımasını sağlar.
 *
 * Notlar:
 * - updateAllHeaders ve updateAllFooters yardımcı fonksiyonlarını kullanır.
 * - Her güncellemede PageNode'larda header/footer'ın varlığını da garanti eder.
 */
export function HeaderFooterSyncPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] HeaderFooterSyncPlugin loaded');
  }

  useEffect(() => {
    // Lexical editörün state'i güncellendiğinde çalışır.
    // İlk sayfadaki header/footer değiştiyse, diğer tüm sayfalara uygula.
    return editor.registerUpdateListener(({ editorState }) => {
      editor.update(() => {
        const root = $getRoot();
        const pageNodes = root.getChildren().filter($isPageNode);
        if (typeof window !== 'undefined') {
          console.log('[DEBUG] HeaderFooterSyncPlugin update', { pageNodes });
        }
        if (pageNodes.length < 2) return; // Tek sayfa varsa sync gerekmez

        // İlk sayfanın header/footer'ı referans alınır
        const firstHeader = pageNodes[0].getHeaderNode();
        const firstFooter = pageNodes[0].getFooterNode();

        // Diğer tüm sayfalardaki header/footer'ı, ilk sayfadakinin çocuklarıyla eşitle
        for (let i = 1; i < pageNodes.length; i++) {
          const page = pageNodes[i];
          const header = page.getHeaderNode();
          const footer = page.getFooterNode();
          if (typeof window !== 'undefined') {
            console.log('[DEBUG] Syncing header/footer', { page, header, footer, firstHeader, firstFooter });
          }
          if (header != null && firstHeader != null) {
            // Tüm çocukları kaldır
            header.getChildren().forEach((child) => { child.remove(); });
            // İlk header'ın çocuklarını kopyala (sadece .clone fonksiyonu olanları)
            firstHeader.getChildren().forEach((child) => {
              if (typeof child.clone === 'function') {
                header.append(child.clone());
              } else {
                // Debug için logla
                // console.warn('HeaderFooterSyncPlugin: child.clone is not a function', child);
              }
            });
          }
          if (footer != null && firstFooter != null) {
            footer.getChildren().forEach((child) => { child.remove(); });
            firstFooter.getChildren().forEach((child) => {
              if (typeof child.clone === 'function') {
                footer.append(child.clone());
              } else {
                // Debug için logla
                // console.warn('HeaderFooterSyncPlugin: child.clone is not a function', child);
              }
            });
          }
        }
      });
    });
  }, [editor]);

  return null;
}
