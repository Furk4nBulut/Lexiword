import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, ParagraphNode, TextNode, LineBreakNode } from 'lexical';
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
    // debug log kaldırıldı
  }

  useEffect(() => {
    // Lexical editörün state'i güncellendiğinde çalışır.
    // İlk sayfadaki header/footer değiştiyse, diğer tüm sayfalara uygula.
    return editor.registerUpdateListener(({ editorState }) => {
      // Önce sadece okuma işlemleri için node referanslarını al
      let pageNodes = [];
      let firstHeader = null;
      let firstFooter = null;
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);
        if (pageNodes.length < 2) return;
        firstHeader = pageNodes[0].getHeaderNode();
        firstFooter = pageNodes[0].getFooterNode();
      });
      // Mutasyonları ayrı bir update bloğunda yap
      if (pageNodes.length < 2 || firstHeader == null || firstFooter == null) return;
      editor.update(() => {
        for (let i = 1; i < pageNodes.length; i++) {
          const page = pageNodes[i];
          const header = page.getHeaderNode();
          const footer = page.getFooterNode();
          if (header != null && firstHeader != null) {
            header.getChildren().forEach((child) => {
              child.remove();
            });
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
            footer.getChildren().forEach((child) => {
              child.remove();
            });
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
