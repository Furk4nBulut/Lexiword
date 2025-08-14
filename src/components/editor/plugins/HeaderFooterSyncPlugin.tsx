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
      function getTextAndLinebreakContent(children: any[]): string {
        return JSON.stringify(
          children.map((child: any) => {
            if (typeof child.getType === 'function') {
              const type = child.getType();
              if (type === 'text' && typeof child.getTextContent === 'function') {
                return { type: 'text', text: child.getTextContent() };
              } else if (type === 'linebreak') {
                return { type: 'linebreak' };
              }
            }
            return null;
          })
        );
      }
  let pageNodes: any[] = [];
      let firstHeader: any = null;
      let firstFooter: any = null;
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);
        if (pageNodes.length < 2) return;
        firstHeader = pageNodes[0].getHeaderNode();
        firstFooter = pageNodes[0].getFooterNode();
      });
      if (pageNodes.length < 2) return;
      editor.update(() => {
        // Header güncellemesi
        if (firstHeader != null) {
          for (let i = 1; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();
            if (header != null) {
              const headerContent = JSON.stringify(header.getChildren().map((n: unknown) => {
                const node = n as { exportJSON?: () => any };
                return typeof node.exportJSON === 'function' ? node.exportJSON() : null;
              }));
              const firstHeaderContent = JSON.stringify(firstHeader.getChildren().map((n: unknown) => {
                const node = n as { exportJSON?: () => any };
                return typeof node.exportJSON === 'function' ? node.exportJSON() : null;
              }));
              if (headerContent !== firstHeaderContent) {
                const children = firstHeader.getChildren();
                const onlyTextOrLinebreak = children.every((child: any) => {
                  if (typeof child.getType === 'function') {
                    const type = child.getType();
                    return type === 'text' || type === 'linebreak';
                  }
                  return false;
                });
                if (Boolean(onlyTextOrLinebreak)) {
                  const headerChildren = header.getChildren();
                  let oldParaContent = '';
                  if (
                    headerChildren.length === 1 &&
                    typeof headerChildren[0].getType === 'function' &&
                    headerChildren[0].getType() === 'paragraph'
                  ) {
                    const paraNode = headerChildren[0];
                    oldParaContent = getTextAndLinebreakContent(paraNode.getChildren());
                  }
                  const newParaContent = getTextAndLinebreakContent(children);
                  // Eğer eski ve yeni içerik aynıysa veya ikisi de boşsa hiçbir şey yapma
                  if (!(oldParaContent === newParaContent || (!oldParaContent && !newParaContent))) {
                    header.getChildren().forEach((child: any) => { child.remove(); });
                    if (children.length > 0) {
                      const para = new ParagraphNode();
                      children.forEach((child: any) => {
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
                } else {
                  // Paragraph veya başka node var, doğrudan clone ile kopyalanıyor.
                  header.getChildren().forEach((child: any) => { child.remove(); });
                  children.forEach((child: any) => {
                    if (typeof child.clone === 'function' && child !== header && child.getParent() !== header) {
                      header.append(child.clone());
                    }
                  });
                }
              }
            }
          }
        }
        // Footer güncellemesi
        if (firstFooter != null) {
          for (let i = 1; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();
            if (footer != null) {
              const footerContent = JSON.stringify(footer.getChildren().map((n: unknown) => {
                const node = n as { exportJSON?: () => any };
                return typeof node.exportJSON === 'function' ? node.exportJSON() : null;
              }));
              const firstFooterContent = JSON.stringify(firstFooter.getChildren().map((n: unknown) => {
                const node = n as { exportJSON?: () => any };
                return typeof node.exportJSON === 'function' ? node.exportJSON() : null;
              }));
              if (footerContent !== firstFooterContent) {
                const children = firstFooter.getChildren();
                const onlyTextOrLinebreak = children.every((child: any) => {
                  if (typeof child.getType === 'function') {
                    const type = child.getType();
                    return type === 'text' || type === 'linebreak';
                  }
                  return false;
                });
                if (onlyTextOrLinebreak) {
                  const footerChildren = footer.getChildren();
                  let oldParaContent = '';
                  if (
                    footerChildren.length === 1 &&
                    typeof footerChildren[0].getType === 'function' &&
                    footerChildren[0].getType() === 'paragraph'
                  ) {
                    const paraNode = footerChildren[0];
                    oldParaContent = getTextAndLinebreakContent(paraNode.getChildren());
                  }
                  const newParaContent = getTextAndLinebreakContent(children);
                  // Eğer eski ve yeni içerik aynıysa veya ikisi de boşsa hiçbir şey yapma
                  if (!(oldParaContent === newParaContent || (oldParaContent === '' && newParaContent === ''))) {
                    footer.getChildren().forEach((child: any) => { child.remove(); });
                    if (children.length > 0) {
                      const para = new ParagraphNode();
                      children.forEach((child: any) => {
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
                } else {
                  // Paragraph veya başka node var, doğrudan clone ile kopyalanıyor.
                  footer.getChildren().forEach((child: any) => { child.remove(); });
                  children.forEach((child: any) => {
                    if (typeof child.clone === 'function' && child !== footer && child.getParent() !== footer) {
                      footer.append(child.clone());
                    }
                  });
                }
              }
            }
          }
        }
      });
    });
  }, [editor]);

  return null;
}
