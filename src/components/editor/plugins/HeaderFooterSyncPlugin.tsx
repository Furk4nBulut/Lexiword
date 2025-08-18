
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, ParagraphNode, TextNode, LineBreakNode, ElementNode } from 'lexical';
import { $isPageNode, type PageNode } from '../nodes/PageNode';

// Sade ve tek fonksiyon: HeaderFooterSyncPlugin
export function HeaderFooterSyncPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      let pageNodes: PageNode[] = [];
      let refHeaderJSON: any[] | null = null;
      let refFooterJSON: any[] | null = null;
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);
        if (pageNodes.length < 2) return;
        const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
        // Header focus veya ilk dolu header
        for (let i = 0; i < pageNodes.length; i++) {
          const page = pageNodes[i];
          const header = page.getHeaderNode();
          if (header instanceof ElementNode) {
            const headerKey = header.getKey();
            let headerDom: Element | null = null;
            if (typeof document !== 'undefined') {
              headerDom = document.querySelector(`[data-lexical-node-key='${headerKey}']`);
            }
            if (headerDom !== null && activeElement === headerDom) {
              refHeaderJSON = header.getChildren().map((n: any) => n.exportJSON());
              break;
            }
          }
        }
        if (refHeaderJSON === null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();
            if (header instanceof ElementNode) {
              const children = header.getChildren();
              const isEmpty =
                children.length === 0 ||
                children.every((child: any) => {
                  if (child instanceof TextNode) return child.getTextContent() === '';
                  if (child instanceof LineBreakNode) return true;
                  if (child instanceof ParagraphNode) {
                    const paraChildren = child.getChildren();
                    return (
                      paraChildren.length === 0 ||
                      paraChildren.every((c: any) => {
                        if (c instanceof TextNode) return c.getTextContent() === '';
                        if (c instanceof LineBreakNode) return true;
                        return false;
                      })
                    );
                  }
                  return false;
                });
              if (!isEmpty) {
                refHeaderJSON = header.getChildren().map((n: any) => n.exportJSON());
                break;
              }
            }
          }
        }
        // Footer focus veya ilk dolu footer
        for (let i = 0; i < pageNodes.length; i++) {
          const page = pageNodes[i];
          const footer = page.getFooterNode();
          if (footer instanceof ElementNode) {
            const footerKey = footer.getKey();
            let footerDom: Element | null = null;
            if (typeof document !== 'undefined') {
              footerDom = document.querySelector(`[data-lexical-node-key='${footerKey}']`);
            }
            if (footerDom !== null && activeElement === footerDom) {
              refFooterJSON = footer.getChildren().map((n: any) => n.exportJSON());
              break;
            }
          }
        }
        if (refFooterJSON === null) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();
            if (footer instanceof ElementNode) {
              const children = footer.getChildren();
              const isEmpty =
                children.length === 0 ||
                children.every((child: any) => {
                  if (child instanceof TextNode) return child.getTextContent() === '';
                  if (child instanceof LineBreakNode) return true;
                  if (child instanceof ParagraphNode) {
                    const paraChildren = child.getChildren();
                    return (
                      paraChildren.length === 0 ||
                      paraChildren.every((c: any) => {
                        if (c instanceof TextNode) return c.getTextContent() === '';
                        if (c instanceof LineBreakNode) return true;
                        return false;
                      })
                    );
                  }
                  return false;
                });
              if (!isEmpty) {
                refFooterJSON = footer.getChildren().map((n: any) => n.exportJSON());
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
              const headerContent = JSON.stringify(headerChildren.map((n: any) => n.exportJSON()));
              const refHeaderContent = JSON.stringify(refHeaderJSON);
              if (headerContent !== refHeaderContent) {
                header.clear();
                refHeaderJSON.forEach((childJSON: any) => {
                  const type = childJSON.type;
                  if (type === 'paragraph') {
                    const para = new ParagraphNode();
                    if (Array.isArray(childJSON.children)) {
                      childJSON.children.forEach((grandChild: any) => {
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
              const footerContent = JSON.stringify(footerChildren.map((n: any) => n.exportJSON()));
              const refFooterContent = JSON.stringify(refFooterJSON);
              if (footerContent !== refFooterContent) {
                footer.clear();
                refFooterJSON.forEach((childJSON: any) => {
                  const type = childJSON.type;
                  if (type === 'paragraph') {
                    const para = new ParagraphNode();
                    if (Array.isArray(childJSON.children)) {
                      childJSON.children.forEach((grandChild: any) => {
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
