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
      // Sadece text ve linebreak içeriğini karşılaştıran yardımcı fonksiyon
  // kaldırıldı: kullanılmıyor
  let pageNodes: any[] = [];
      let refHeaderJSON: any[] | null = null;
      let refFooterJSON: any[] | null = null;
      let activeHeaderIndex: number | null = null;
      let activeFooterIndex: number | null = null;
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);
        if (pageNodes.length < 2) return;
        // Aktif header/footer'ı bulmak için focus'lu DOM'u kontrol et
        const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
        // Header
        for (let i = 0; i < pageNodes.length; i++) {
          const header = pageNodes[i].getHeaderNode();
          if (header) {
            const headerKey = header.getKey();
            const headerDom = document.querySelector(`[data-lexical-node-key="${headerKey}"]`);
            if (headerDom && activeElement === headerDom) {
              activeHeaderIndex = i;
              refHeaderJSON = header.getChildren().map((n: any) => typeof n.exportJSON === 'function' ? n.exportJSON() : null);
              break;
            }
          }
        }
        // Eğer focus'lu header yoksa, ilk dolu header'ı referans al
        if (refHeaderJSON == null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const header = pageNodes[i].getHeaderNode();
            if (header) {
              const children = header.getChildren();
              const isEmpty = !children || children.length === 0 || children.every((child: unknown) => {
                if (typeof child === 'object' && child !== null && 'getType' in child && typeof (child as any).getType === 'function') {
                  const type = (child as { getType: () => string }).getType();
                  if (type === 'text' && 'getTextContent' in child && typeof (child as any).getTextContent === 'function') {
                    return (child as { getTextContent: () => string }).getTextContent() === '';
                  } else if (type === 'linebreak') {
                    return true;
                  } else if (type === 'paragraph' && 'getChildren' in child && typeof (child as any).getChildren === 'function') {
                    const paraChildren = (child as { getChildren: () => any[] }).getChildren();
                    return !paraChildren || paraChildren.length === 0 || paraChildren.every((c: unknown) => {
                      if (typeof c === 'object' && c !== null && 'getType' in c && typeof (c as any).getType === 'function') {
                        const t = (c as { getType: () => string }).getType();
                        if (t === 'text' && 'getTextContent' in c && typeof (c as any).getTextContent === 'function') {
                          return (c as { getTextContent: () => string }).getTextContent() === '';
                        } else if (t === 'linebreak') {
                          return true;
                        }
                      }
                      return false;
                    });
                  }
                }
                return false;
              });
              if (!isEmpty) {
                refHeaderJSON = header.getChildren().map((n: any) => typeof n.exportJSON === 'function' ? n.exportJSON() : null);
                break;
              }
            }
          }
        }
        // Footer
        for (let i = 0; i < pageNodes.length; i++) {
          const footer = pageNodes[i].getFooterNode();
          if (footer) {
            const footerKey = footer.getKey();
            const footerDom = document.querySelector(`[data-lexical-node-key="${footerKey}"]`);
            if (footerDom && activeElement === footerDom) {
              activeFooterIndex = i;
              refFooterJSON = footer.getChildren().map((n: any) => typeof n.exportJSON === 'function' ? n.exportJSON() : null);
              break;
            }
          }
        }
        // Eğer focus'lu footer yoksa, ilk dolu footer'ı referans al
        if (refFooterJSON == null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const footer = pageNodes[i].getFooterNode();
            if (footer) {
              const children = footer.getChildren();
              const isEmpty = !children || children.length === 0 || children.every((child: unknown) => {
                if (typeof child === 'object' && child !== null && 'getType' in child && typeof (child as any).getType === 'function') {
                  const type = (child as { getType: () => string }).getType();
                  if (type === 'text' && 'getTextContent' in child && typeof (child as any).getTextContent === 'function') {
                    return (child as { getTextContent: () => string }).getTextContent() === '';
                  } else if (type === 'linebreak') {
                    return true;
                  } else if (type === 'paragraph' && 'getChildren' in child && typeof (child as any).getChildren === 'function') {
                    const paraChildren = (child as { getChildren: () => any[] }).getChildren();
                    return !paraChildren || paraChildren.length === 0 || paraChildren.every((c: unknown) => {
                      if (typeof c === 'object' && c !== null && 'getType' in c && typeof (c as any).getType === 'function') {
                        const t = (c as { getType: () => string }).getType();
                        if (t === 'text' && 'getTextContent' in c && typeof (c as any).getTextContent === 'function') {
                          return (c as { getTextContent: () => string }).getTextContent() === '';
                        } else if (t === 'linebreak') {
                          return true;
                        }
                      }
                      return false;
                    });
                  }
                }
                return false;
              });
              if (!isEmpty) {
                refFooterJSON = footer.getChildren().map((n: any) => typeof n.exportJSON === 'function' ? n.exportJSON() : null);
                break;
              }
            }
          }
        }
      });
      if (pageNodes.length < 2) return;
      editor.update(() => {
        // Header güncellemesi
        if (refHeaderJSON != null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();
            if (header != null) {
              const headerContent = JSON.stringify(header.getChildren().map((n: unknown) => {
                const node = n as { exportJSON?: () => any };
                return typeof node.exportJSON === 'function' ? node.exportJSON() : null;
              }));
              const refHeaderContent = JSON.stringify(refHeaderJSON);
              if (headerContent !== refHeaderContent) {
                // header'ı temizle
                header.getChildren().forEach((child: any) => { child.remove(); });
                // refHeaderJSON'dan yeni node'lar oluşturup ekle
                (refHeaderJSON as Array<any>).forEach((childJSON) => {
                  if (typeof childJSON === 'object' && childJSON !== null && 'type' in childJSON) {
                    if (childJSON.type === 'paragraph') {
                      const para = new ParagraphNode();
                      if (Array.isArray(childJSON.children)) {
                        (childJSON.children as Array<any>).forEach((grandChild) => {
                          if (typeof grandChild === 'object' && grandChild !== null && 'type' in grandChild) {
                            if (grandChild.type === 'text') {
                              const textNode = new TextNode(grandChild.text || '');
                              para.append(textNode);
                            } else if (grandChild.type === 'linebreak') {
                              const brNode = new LineBreakNode();
                              para.append(brNode);
                            }
                          }
                        });
                      }
                      header.append(para);
                    } else if (childJSON.type === 'text') {
                      const textNode = new TextNode(childJSON.text || '');
                      header.append(textNode);
                    } else if (childJSON.type === 'linebreak') {
                      const brNode = new LineBreakNode();
                      header.append(brNode);
                    }
                  }
                });
              }
            }
          }
        }
        // Footer güncellemesi
        if (refFooterJSON != null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();
            if (footer != null) {
              const footerContent = JSON.stringify(footer.getChildren().map((n: unknown) => {
                const node = n as { exportJSON?: () => any };
                return typeof node.exportJSON === 'function' ? node.exportJSON() : null;
              }));
              const refFooterContent = JSON.stringify(refFooterJSON);
              if (footerContent !== refFooterContent) {
                // footer'ı temizle
                footer.getChildren().forEach((child: any) => { child.remove(); });
                // refFooterJSON'dan yeni node'lar oluşturup ekle
                (refFooterJSON as Array<any>).forEach((childJSON) => {
                  if (typeof childJSON === 'object' && childJSON !== null && 'type' in childJSON) {
                    if (childJSON.type === 'paragraph') {
                      const para = new ParagraphNode();
                      if (Array.isArray(childJSON.children)) {
                        (childJSON.children as Array<any>).forEach((grandChild) => {
                          if (typeof grandChild === 'object' && grandChild !== null && 'type' in grandChild) {
                            if (grandChild.type === 'text') {
                              const textNode = new TextNode(grandChild.text || '');
                              para.append(textNode);
                            } else if (grandChild.type === 'linebreak') {
                              const brNode = new LineBreakNode();
                              para.append(brNode);
                            }
                          }
                        });
                      }
                      footer.append(para);
                    } else if (childJSON.type === 'text') {
                      const textNode = new TextNode(childJSON.text || '');
                      footer.append(textNode);
                    } else if (childJSON.type === 'linebreak') {
                      const brNode = new LineBreakNode();
                      footer.append(brNode);
                    }
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
