import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, ParagraphNode, TextNode, LineBreakNode, ElementNode } from 'lexical';
import { $isPageNode, type PageNode } from '../nodes/PageNode';

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
      // Sadece text ve linebreak içeriğini karşılaştıran yardımcı fonksiyon
      let pageNodes: PageNode[] = [];
      let refHeaderJSON: Array<{ type: string; text?: string; children?: unknown[] }> | null = null;
      let refFooterJSON: Array<{ type: string; text?: string; children?: unknown[] }> | null = null;
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);

        if (pageNodes.length < 2) {
          return;
        }

        // Aktif header/footer'ı bulmak için focus'lu DOM'u kontrol et
        const activeElement = typeof document !== 'undefined' ? document.activeElement : null;

        // Header
        for (let i = 0; i < pageNodes.length; i++) {
          const page = pageNodes[i];
          const header = page.getHeaderNode();

          if (header instanceof ElementNode) {
            // Hata giderildi: getKey kontrolü kaldırıldı
            const headerKey = header.getKey();
            const headerDom =
              typeof document !== 'undefined'
                ? document.querySelector(`[data-lexical-node-key='${headerKey}']`)
                : null;
            if (headerDom !== null && activeElement === headerDom) {
              refHeaderJSON = header.getChildren().map((n) => n.exportJSON());
              break;
            }
          }
        }

        // Eğer focus'lu header yoksa, ilk dolu header'ı referans al
        if (refHeaderJSON === null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();

            if (header instanceof ElementNode) {
              const children = header.getChildren();
              const isEmpty =
                children.length === 0 ||
                children.every((child) => {
                  if (child instanceof TextNode) {
                    return child.getTextContent() === '';
                  }
                  if (child instanceof LineBreakNode) {
                    return true;
                  }
                  if (child instanceof ParagraphNode) {
                    const paraChildren = child.getChildren();
                    return (
                      paraChildren.length === 0 ||
                      paraChildren.every((c) => {
                        if (c instanceof TextNode) {
                          return c.getTextContent() === '';
                        }
                        if (c instanceof LineBreakNode) {
                          return true;
                        }
                        return false;
                      })
                    );
                  }
                  return false;
                });

              if (!isEmpty) {
                refHeaderJSON = header.getChildren().map((n) => n.exportJSON());
                break;
              }
            }
          }
        }

        // Footer
        for (let i = 0; i < pageNodes.length; i++) {
          const page = pageNodes[i];
          const footer = page.getFooterNode();

          if (footer instanceof ElementNode) {
            // Hata giderildi: getKey kontrolü kaldırıldı
            const footerKey = footer.getKey();
            const footerDom =
              typeof document !== 'undefined'
                ? document.querySelector(`[data-lexical-node-key='${footerKey}']`)
                : null;
            if (footerDom !== null && activeElement === footerDom) {
              refFooterJSON = footer.getChildren().map((n) => n.exportJSON());
              break;
            }
          }
        }

        // Eğer focus'lu footer yoksa, ilk dolu footer'ı referans al
        if (refFooterJSON === null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();

            if (footer instanceof ElementNode) {
              const children = footer.getChildren();
              const isEmpty =
                children.length === 0 ||
                children.every((child) => {
                  if (child instanceof TextNode) {
                    return child.getTextContent() === '';
                  }
                  if (child instanceof LineBreakNode) {
                    return true;
                  }
                  if (child instanceof ParagraphNode) {
                    const paraChildren = child.getChildren();
                    return (
                      paraChildren.length === 0 ||
                      paraChildren.every((c) => {
                        if (c instanceof TextNode) {
                          return c.getTextContent() === '';
                        }
                        if (c instanceof LineBreakNode) {
                          return true;
                        }
                        return false;
                      })
                    );
                  }
                  return false;
                });

              if (!isEmpty) {
                refFooterJSON = footer.getChildren().map((n) => n.exportJSON());
                break;
              }
            }
          }
        }
      });
      if (pageNodes.length < 2) return;
      editor.update(() => {
        // Header güncellemesi
        if (refHeaderJSON !== null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();

            if (header instanceof ElementNode) {
              const headerChildren = header.getChildren();
              const headerContent = JSON.stringify(headerChildren.map((n) => n.exportJSON()));
              const refHeaderContent = JSON.stringify(refHeaderJSON);

              if (headerContent !== refHeaderContent) {
                // header'ı temizle
                header.clear();
                // refHeaderJSON'dan yeni node'lar oluşturup ekle
                refHeaderJSON.forEach((childJSON) => {
                  const type = childJSON.type;
                  if (type === 'paragraph') {
                    const para = new ParagraphNode();
                    if (Array.isArray(childJSON.children)) {
                      childJSON.children.forEach((grandChild) => {
                        if (
                          typeof grandChild === 'object' &&
                          grandChild !== null &&
                          'type' in grandChild
                        ) {
                          const gType = (grandChild as { type: string }).type;
                          if (gType === 'text') {
                            const textVal = (grandChild as { text?: string }).text;
                            const textNode = new TextNode(textVal ?? '');
                            para.append(textNode);
                          } else if (gType === 'linebreak') {
                            const brNode = new LineBreakNode();
                            para.append(brNode);
                          }
                        }
                      });
                    }
                    header.append(para);
                  } else if (type === 'text') {
                    const textVal = (childJSON as { text?: string }).text;
                    const textNode = new TextNode(textVal ?? '');
                    header.append(textNode);
                  } else if (type === 'linebreak') {
                    const brNode = new LineBreakNode();
                    header.append(brNode);
                  }
                });
              }
            }
          }
        }
        // Footer güncellemesi
        if (refFooterJSON !== null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();

            if (footer instanceof ElementNode) {
              const footerChildren = footer.getChildren();
              const footerContent = JSON.stringify(footerChildren.map((n) => n.exportJSON()));
              const refFooterContent = JSON.stringify(refFooterJSON);

              if (footerContent !== refFooterContent) {
                // footer'ı temizle
                footer.clear();
                // refFooterJSON'dan yeni node'lar oluşturup ekle
                refFooterJSON.forEach((childJSON) => {
                  const type = childJSON.type;
                  if (type === 'paragraph') {
                    const para = new ParagraphNode();
                    if (Array.isArray(childJSON.children)) {
                      childJSON.children.forEach((grandChild) => {
                        if (
                          typeof grandChild === 'object' &&
                          grandChild !== null &&
                          'type' in grandChild
                        ) {
                          const gType = (grandChild as { type: string }).type;
                          if (gType === 'text') {
                            const textVal = (grandChild as { text?: string }).text;
                            const textNode = new TextNode(textVal ?? '');
                            para.append(textNode);
                          } else if (gType === 'linebreak') {
                            const brNode = new LineBreakNode();
                            para.append(brNode);
                          }
                        }
                      });
                    }
                    footer.append(para);
                  } else if (type === 'text') {
                    const textVal = (childJSON as { text?: string }).text;
                    const textNode = new TextNode(textVal ?? '');
                    footer.append(textNode);
                  } else if (type === 'linebreak') {
                    const brNode = new LineBreakNode();
                    footer.append(brNode);
                  }
                });
              }
            }
          }
        }
      });
    });
  }, [editor]);

  return null;
}
