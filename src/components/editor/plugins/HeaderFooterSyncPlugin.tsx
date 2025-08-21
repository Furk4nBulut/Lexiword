import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot, ParagraphNode, TextNode, LineBreakNode, ElementNode } from 'lexical';
import { deepEqual } from '../utils/deepEqual';
import { HEADER_FOOTER_SYNC_ENABLED } from '../context/HeaderFooterSyncModeContext';
import { $isPageNode, type PageNode } from '../nodes/PageNode';

// Sade ve tek fonksiyon: HeaderFooterSyncPlugin
export function HeaderFooterSyncPlugin(): JSX.Element | null {
  // Sync kapalıysa hiçbir şey yapma
  if (!HEADER_FOOTER_SYNC_ENABLED) return null;
  const [editor] = useLexicalComposerContext();
  // Son düzenlenen header/footer'ın key'ini saklamak için ref kullanıyoruz
  const lastEditedHeaderKey = useRef<string | null>(null);
  const lastEditedFooterKey = useRef<string | null>(null);
  // Sonsuz döngüyü engellemek için reentrancy guard
  const isSyncingRef = useRef(false);

  // DOM event listener ekle: Her header/footer'a input/focus event'i ile key'i güncelle
  useEffect(() => {
    function handleInputOrFocus(e: Event): void {
      const el = e.target as HTMLElement;
      const key = el.getAttribute('data-lexical-node-key');
      if (el.classList.contains('a4-header')) {
        lastEditedHeaderKey.current = key;
      } else if (el.classList.contains('a4-footer')) {
        lastEditedFooterKey.current = key;
      }
    }
    // Tüm header/footer DOM'larına event listener ekle
    function addListeners(): void {
      document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
        el.addEventListener('input', handleInputOrFocus);
        el.addEventListener('focus', handleInputOrFocus);
      });
    }
    function removeListeners(): void {
      document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
        el.removeEventListener('input', handleInputOrFocus);
        el.removeEventListener('focus', handleInputOrFocus);
      });
    }
    addListeners();
    // Her Lexical güncellemesinde tekrar ekle (çünkü DOM değişebilir)
    const cleanup = editor.registerUpdateListener(() => {
      removeListeners();
      addListeners();
    });
    return () => {
      removeListeners();
      cleanup();
    };
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (isSyncingRef.current) return;
      let pageNodes: PageNode[] = [];
      let refHeaderJSON: any[] | null = null;
      let refFooterJSON: any[] | null = null;
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);
        // Eğer referans alınacak header/footer yoksa veya tek sayfa varsa, sync işlemini atla
        if (pageNodes.length < 2) return;
        // Öncelik: Son düzenlenen header/footer'ın key'i
        if (
          lastEditedHeaderKey.current !== null &&
          lastEditedHeaderKey.current !== undefined &&
          lastEditedHeaderKey.current !== ''
        ) {
          const header = pageNodes
            .map((p) => p.getHeaderNode())
            .find(
              (h) => h !== undefined && h !== null && h.getKey() === lastEditedHeaderKey.current
            );
          if (header !== undefined && header !== null) {
            refHeaderJSON = header
              .getChildren()
              .filter((n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number')
              .map((n: any) => n.exportJSON());
          }
        }
        if (refHeaderJSON === null) {
          // Fallback: focus veya ilk dolu header
          const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
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
                refHeaderJSON = header
                  .getChildren()
                  .filter(
                    (n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number'
                  )
                  .map((n: any) => n.exportJSON());
                break;
              }
            }
          }
        }
        if (refHeaderJSON === null) {
          // Fallback: ilk dolu header
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();
            if (header instanceof ElementNode) {
              const children = header
                .getChildren()
                .filter(
                  (n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number'
                );
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
                refHeaderJSON = children.map((n: any) => n.exportJSON());
                break;
              }
            }
          }
        }
        // Aynı mantıkla footer
        if (
          lastEditedFooterKey.current !== null &&
          lastEditedFooterKey.current !== undefined &&
          lastEditedFooterKey.current !== ''
        ) {
          const footer = pageNodes
            .map((p) => p.getFooterNode())
            .find(
              (f) => f !== undefined && f !== null && f.getKey() === lastEditedFooterKey.current
            );
          if (footer !== undefined && footer !== null) {
            refFooterJSON = footer
              .getChildren()
              .filter((n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number')
              .map((n: any) => n.exportJSON());
          }
        }
        if (refFooterJSON === null) {
          // Fallback: focus veya ilk dolu footer
          const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
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
                refFooterJSON = footer
                  .getChildren()
                  .filter(
                    (n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number'
                  )
                  .map((n: any) => n.exportJSON());
                break;
              }
            }
          }
        }
        if (refFooterJSON === null) {
          // Fallback: ilk dolu footer
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();
            if (footer instanceof ElementNode) {
              const children = footer
                .getChildren()
                .filter(
                  (n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number'
                );
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
                refFooterJSON = children.map((n: any) => n.exportJSON());
                break;
              }
            }
          }
        }
      });
      // Eğer referans alınacak header/footer yoksa, sync işlemini atla
      if (refHeaderJSON === null && refFooterJSON === null) return;
      editor.update(() => {
        if (isSyncingRef.current) return;
        let didSync = false;
        // Header güncellemesi
        if (refHeaderJSON !== null && Array.isArray(refHeaderJSON) && refHeaderJSON.length > 0) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const header = page.getHeaderNode();
            if (header instanceof ElementNode) {
              const headerChildren = header
                .getChildren()
                .filter(
                  (n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number'
                );
              const headerContentArr = headerChildren.map((n: any) => n.exportJSON());
              // Eğer referans içerik boşsa asla clear ve append yapma
              if (refHeaderJSON.length === 0) continue;
              if (!deepEqual(headerContentArr, refHeaderJSON)) {
                isSyncingRef.current = true;
                didSync = true;
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
        if (refFooterJSON !== null && Array.isArray(refFooterJSON) && refFooterJSON.length > 0) {
          for (let i = 0; i < pageNodes.length; i++) {
            const page = pageNodes[i];
            const footer = page.getFooterNode();
            if (footer instanceof ElementNode) {
              const footerChildren = footer
                .getChildren()
                .filter(
                  (n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number'
                );
              const footerContentArr = footerChildren.map((n: any) => n.exportJSON());
              // Eğer referans içerik boşsa asla clear ve append yapma
              if (refFooterJSON.length === 0) continue;
              if (!deepEqual(footerContentArr, refFooterJSON)) {
                isSyncingRef.current = true;
                didSync = true;
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
        if (didSync) {
          // Bir defa sync yaptıysak, döngüye girmemek için flag'i hemen sıfırla (microtask'ta)
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 0);
        }
      });
    });
  }, [editor]);
  return null;
}
