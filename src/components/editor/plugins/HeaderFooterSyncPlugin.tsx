import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot, ParagraphNode, TextNode, LineBreakNode, ElementNode } from 'lexical';
import { $isPageNode, type PageNode } from '../nodes/PageNode';

// Yardımcı: Header/Footer içeriğini JSON olarak döndür
function getSectionJSON(section: ElementNode | null): any[] | null {
  if (section == null) return null;
  if (!(section instanceof ElementNode)) return null;
  return section.getChildren().map((n) => n.exportJSON());
}

// Yardımcı: Header/Footer boş mu?
function isSectionEmpty(section: ElementNode | null): boolean {
  if (section == null) return true;
  if (!(section instanceof ElementNode)) return true;
  const children = section.getChildren();
  return (
    children.length === 0 ||
    children.every((child) => {
      if (child instanceof TextNode) return child.getTextContent() === '';
      if (child instanceof LineBreakNode) return true;
      if (child instanceof ParagraphNode) {
        const paraChildren = child.getChildren();
        return (
          paraChildren.length === 0 ||
          paraChildren.every((c) => {
            if (c instanceof TextNode) return c.getTextContent() === '';
            if (c instanceof LineBreakNode) return true;
            return false;
          })
        );
      }
      return false;
    })
  );
}

// Yardımcı: JSON'dan node oluşturup section'a ekle
function appendSectionFromJSON(section: ElementNode, json: any[]): void {
  json.forEach((childJSON: any) => {
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
      section.append(para);
    } else if (type === 'text') {
      const textVal = (childJSON as { text?: string }).text;
      const textNode = new TextNode(textVal ?? '');
      section.append(textNode);
    } else if (type === 'linebreak') {
      const brNode = new LineBreakNode();
      section.append(brNode);
    }
  });
}

// Yardımcı: Referans header/footer'ı bul
function findReferenceSection(pageNodes: PageNode[], sectionType: 'header' | 'footer', activeElement: Element | null): any[] | null {
  // Öncelik: focus'lu section
  for (let i = 0; i < pageNodes.length; i++) {
    const page = pageNodes[i];
    const section = sectionType === 'header' ? page.getHeaderNode() : page.getFooterNode();
    if (section instanceof ElementNode) {
      const sectionKey = section.getKey();
      const sectionDom =
        typeof document !== 'undefined'
          ? document.querySelector(`[data-lexical-node-key='${sectionKey}']`)
          : null;
      if (sectionDom !== null && activeElement === sectionDom) {
        return getSectionJSON(section);
      }
    }
  }
  // İkinci öncelik: ilk dolu section
  for (let i = 0; i < pageNodes.length; i++) {
    const page = pageNodes[i];
    const section = sectionType === 'header' ? page.getHeaderNode() : page.getFooterNode();
    if (section instanceof ElementNode && !isSectionEmpty(section)) {
      return getSectionJSON(section);
    }
  }
  return null;
}

// Yardımcı: Tüm sayfalarda section'ı güncelle
function updateAllSections(
  pageNodes: PageNode[],
  sectionType: 'header' | 'footer',
  refJSON: any[] | null
): void {
  if (refJSON == null) return;
  for (let i = 0; i < pageNodes.length; i++) {
    const page = pageNodes[i];
    const section = sectionType === 'header' ? page.getHeaderNode() : page.getFooterNode();
    if (section instanceof ElementNode) {
      const sectionChildren = section.getChildren();
      const sectionContent = JSON.stringify(sectionChildren.map((n) => n.exportJSON()));
      const refContent = JSON.stringify(refJSON);
      if (sectionContent !== refContent) {
        section.clear();
        appendSectionFromJSON(section, refJSON);
      }
    }
  }
}

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


  const prevHeaderJSONRef = useRef<string | null>(null);
  const prevFooterJSONRef = useRef<string | null>(null);
  const prevPageCountRef = useRef<number>(0);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      let pageNodes: PageNode[] = [];
      let refHeaderJSON: any[] | null = null;
      let refFooterJSON: any[] | null = null;
      let shouldSync = false;
      try {
        editorState.read(() => {
          const root = $getRoot();
          pageNodes = root.getChildren().filter($isPageNode);
          const pageCount = pageNodes.length;
          const prevPageCount = prevPageCountRef.current;
          const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
          // Sadece header/footer edit modunda mı?
          const headerFocused = pageNodes.some(page => {
            const header = page.getHeaderNode();
            if (header instanceof ElementNode) {
              const key = header.getKey();
              const dom = typeof document !== 'undefined' ? document.querySelector(`[data-lexical-node-key='${key}']`) : null;
              return dom !== null && activeElement === dom;
            }
            return false;
          });
          const footerFocused = pageNodes.some(page => {
            const footer = page.getFooterNode();
            if (footer instanceof ElementNode) {
              const key = footer.getKey();
              const dom = typeof document !== 'undefined' ? document.querySelector(`[data-lexical-node-key='${key}']`) : null;
              return dom !== null && activeElement === dom;
            }
            return false;
          });

          // Yeni sayfa eklendiyse veya header/footer edit modundaysa sync tetiklenecek
          if (pageCount > prevPageCount) {
            console.log('[HeaderFooterSyncPlugin] Yeni sayfa eklendi, sync tetiklenecek.');
            shouldSync = true;
            prevPageCountRef.current = pageCount;
          } else if (headerFocused || footerFocused) {
            console.log('[HeaderFooterSyncPlugin] Header/footer edit modda, sync tetiklenecek.');
            shouldSync = true;
            prevPageCountRef.current = pageCount;
          } else {
            prevPageCountRef.current = pageCount;
          }

          if (!shouldSync) return;

          refHeaderJSON = findReferenceSection(pageNodes, 'header', activeElement);
          refFooterJSON = findReferenceSection(pageNodes, 'footer', activeElement);
          console.log('[HeaderFooterSyncPlugin] Sync için referans header/footer bulundu.');
        });
        if (!shouldSync || pageNodes.length < 2) return;

        const refHeaderStr = refHeaderJSON !== null ? JSON.stringify(refHeaderJSON) : null;
        const refFooterStr = refFooterJSON !== null ? JSON.stringify(refFooterJSON) : null;

        // Sadece header/footer içeriği değiştiyse update fonksiyonunu çağır
        const headerChanged = prevHeaderJSONRef.current !== refHeaderStr;
        const footerChanged = prevFooterJSONRef.current !== refFooterStr;

        if (!headerChanged && !footerChanged && prevPageCountRef.current !== pageNodes.length) {
          // Sadece yeni sayfa eklendiyse, header/footer değişmediyse sync atlanır
          return;
        }

        prevHeaderJSONRef.current = refHeaderStr;
        prevFooterJSONRef.current = refFooterStr;

        editor.update(() => {
          if (headerChanged || prevPageCountRef.current !== pageNodes.length) {
            console.log('[HeaderFooterSyncPlugin] updateAllSections(header) çağrıldı.');
            updateAllSections(pageNodes, 'header', refHeaderJSON);
          }
          if (footerChanged || prevPageCountRef.current !== pageNodes.length) {
            console.log('[HeaderFooterSyncPlugin] updateAllSections(footer) çağrıldı.');
            updateAllSections(pageNodes, 'footer', refFooterJSON);
          }
        });
      } catch (err) {
        // Hata logu kaldırıldı
      }
    });
  }, [editor]);

  return null;
}
