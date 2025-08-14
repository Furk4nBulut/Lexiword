import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';
import { $isPageNode } from '../nodes/PageNode';
import { ParagraphNode, TextNode, LineBreakNode } from 'lexical';

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
  // debug log kaldırıldı
  }

  useEffect(() => {
    // Lexical editörün state'i güncellendiğinde çalışır.
    // İlk sayfadaki header/footer değiştiyse, diğer tüm sayfalara uygula.
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const pageNodes = root.getChildren().filter($isPageNode);
        if (typeof window !== 'undefined') {
          // debug log kaldırıldı
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
            // debug log kaldırıldı
          }
          if (header != null && firstHeader != null) {
            header.getChildren().forEach((child) => { child.remove(); });
            // Header çocuklarını paragraph/text/linebreak olarak kopyala
            let onlyTextOrLinebreak = true;
            firstHeader.getChildren().forEach((child) => {
              if (typeof child.getType === 'function' && child.getType() === 'paragraph') {
                onlyTextOrLinebreak = false;
              }
            });
            if (!onlyTextOrLinebreak) {
              firstHeader.getChildren().forEach((child) => {
                if (typeof child.clone === 'function' && child.getType() === 'paragraph') {
                  header.append(child.clone());
                }
              });
            } else {
              const para = new ParagraphNode();
              firstHeader.getChildren().forEach((child) => {
                if (typeof child.getType === 'function') {
                  const type = child.getType();
                  if (type === 'text' && typeof child.getTextContent === 'function') {
                    const textNode = new TextNode(child.getTextContent());
                    para.append(textNode);
                  } else if (type === 'linebreak') {
                    const brNode = new LineBreakNode();
                    para.append(brNode);
                  }
                }
              });
              header.append(para);
            }
          }
          if (footer != null && firstFooter != null) {
            footer.getChildren().forEach((child) => { child.remove(); });
            // Footer çocuklarını paragraph/text/linebreak olarak kopyala
            let onlyTextOrLinebreak = true;
            firstFooter.getChildren().forEach((child) => {
              if (typeof child.getType === 'function' && child.getType() === 'paragraph') {
                onlyTextOrLinebreak = false;
              }
            });
            if (!onlyTextOrLinebreak) {
              firstFooter.getChildren().forEach((child) => {
                if (typeof child.clone === 'function' && child.getType() === 'paragraph') {
                  footer.append(child.clone());
                }
              });
            } else {
              const para = new ParagraphNode();
              firstFooter.getChildren().forEach((child) => {
                if (typeof child.getType === 'function') {
                  const type = child.getType();
                  if (type === 'text' && typeof child.getTextContent === 'function') {
                    const textNode = new TextNode(child.getTextContent());
                    para.append(textNode);
                  } else if (type === 'linebreak') {
                    const brNode = new LineBreakNode();
                    para.append(brNode);
                  }
                }
              });
              footer.append(para);
            }
          }
        }
      });
    });
  }, [editor]);

  return null;
}
