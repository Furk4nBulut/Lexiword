import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
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
  const lastHeader = useRef<{ text: string; visible: boolean } | null>(null);
  const lastFooter = useRef<{ text: string; visible: boolean } | null>(null);

  useEffect(() => {
    // Lexical editörün state'i güncellendiğinde çalışır.
    // Header veya footer'da değişiklik olup olmadığını tespit eder.
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        // Tüm sayfalardaki header/footer'ları topla
        const pageNodes = root.getChildren().filter($isPageNode);
        let changedHeader: { text: string; visible: boolean } | null = null;
        let changedFooter: { text: string; visible: boolean } | null = null;
        // Header değişikliği tespiti
        for (const page of pageNodes) {
          const header = page.getHeaderNode();
          if (header != null) {
            // Son header ile mevcut header karşılaştırılır
            if (
              lastHeader.current == null ||
              lastHeader.current.text !== header.__text ||
              lastHeader.current.visible !== header.__visible
            ) {
              changedHeader = { text: header.__text, visible: header.__visible };
              break;
            }
          }
        }
        // Footer değişikliği tespiti
        for (const page of pageNodes) {
          const footer = page.getFooterNode();
          if (footer != null) {
            // Son footer ile mevcut footer karşılaştırılır
            if (
              lastFooter.current == null ||
              lastFooter.current.text !== footer.__text ||
              lastFooter.current.visible !== footer.__visible
            ) {
              changedFooter = { text: footer.__text, visible: footer.__visible };
              break;
            }
          }
        }
  // Artık header/footer toplu güncelleme yok. Sadece varlık kontrolü yapılabilir.
      });
    });
  }, [editor]);

  return null;
}
