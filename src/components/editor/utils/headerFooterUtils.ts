import { ElementNode, ParagraphNode, TextNode, LineBreakNode } from 'lexical';
import { deepEqual } from './deepEqual';
import type { PageNode } from '../nodes/PageNode';

/**
 * headerFooterUtils
 *
 * Header / Footer ile ilgili ortak işlemleri barındırır:
 * - Bir section (header/footer) için referans JSON'unu seçme
 * - Bir section'a JSON uygulanması
 *
 * Amaç: Plugin'ler arasındaki tekrar eden kodu tek bir yerde toplayıp
 * test edilebilir ve okunabilir hale getirmek.
 */

type SectionKind = 'header' | 'footer';

/**
 * Belirtilen PageNode üzerinde, istenen türde (header/footer) section node'unu döndürür.
 * @param page PageNode nesnesi
 * @param kind 'header' veya 'footer'
 * @returns İlgili section node'u veya undefined
 */
function getSectionNode(page: PageNode, kind: SectionKind): ElementNode | undefined {
  return kind === 'header'
    ? (page.getHeaderNode() as ElementNode | undefined)
    : (page.getFooterNode() as ElementNode | undefined);
}

/**
 * Bir section node'unun çocuklarını JSON'a çevirir.
 * 'page-number' tipindeki node'lar filtrelenir (sayfa numarası ayrı yönetildiği için).
 * @param section JSON'a çevrilecek section node'u
 * @returns Çocukların JSON dizisi veya null
 */
export function serializeSectionChildren(section?: ElementNode | null): any[] | null {
  if (section === null || section === undefined) return null;
  if (typeof section.getChildren !== 'function') return null;
  // Sadece page-number olmayan çocukları al
  const children = section
    .getChildren()
    .filter((n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number');
  if (children.length === 0) return [];
  // Her bir çocuğu JSON'a çevir
  return children.map((n: any) => n.exportJSON());
}

/**
 * Bir section'un boş olup olmadığını kontrol eder.
 * Boş kriteri:
 * - Hiç çocuk yoksa
 * - Tüm çocuklar text ise hepsi boş string ve paragraph içindeki textler boşsa
 * @param section Kontrol edilecek section node'u
 * @returns Boşsa true, doluysa false
 */
export function isEmptySection(section?: ElementNode | null): boolean {
  if (section === null || section === undefined) return true;
  if (typeof section.getChildren !== 'function') return true;
  const children = section.getChildren();
  if (children.length === 0) return true;
  // Her bir çocuk için boşluk kontrolü
  return children.every((child: any) => {
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
}

/**
 * pageNodes dizisinden, referans (kopyalanacak) section JSON'unu belirler.
 * Öncelik sırası:
 * 1) lastEditedKey ile eşleşen section
 * 2) aktif element focus'taysa onun section'u
 * 3) ilk dolu section
 * @param pageNodes Tüm sayfa node'ları
 * @param lastEditedKey Son düzenlenen section'un anahtarı
 * @param kind 'header' veya 'footer'
 * @returns Referans section'un JSON'u veya null
 */
export function getReferenceSectionJSON(
  pageNodes: PageNode[],
  lastEditedKey: string | null | undefined,
  kind: SectionKind
): any[] | null {
  // 1) lastEditedKey ile eşleşen section'u bul
  if (lastEditedKey !== null && lastEditedKey !== undefined && lastEditedKey !== '') {
    for (const p of pageNodes) {
      const s = getSectionNode(p, kind);
      if (s !== null && s !== undefined && s.getKey() === lastEditedKey) {
        return serializeSectionChildren(s);
      }
    }
  }

  // 2) Aktif element focus'taysa onun section'unu bul
  const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
  if (activeElement !== null && activeElement !== undefined) {
    for (const p of pageNodes) {
      const s = getSectionNode(p, kind);
      if (s === null || s === undefined) continue;
      const key = s.getKey();
      const dom =
        typeof document !== 'undefined'
          ? document.querySelector(`[data-lexical-node-key='${key}']`)
          : null;
      if (dom !== null && dom === activeElement) {
        return serializeSectionChildren(s);
      }
    }
  }

  // 3) İlk dolu section'u bul
  for (const p of pageNodes) {
    const s = getSectionNode(p, kind);
    if (s !== null && s !== undefined && !isEmptySection(s)) {
      return serializeSectionChildren(s);
    }
  }

  return null;
}

/**
 * Verilen referans JSON'u tüm sayfalardaki ilgili sectionlara uygular.
 * deepEqual ile mevcut içerik ile karşılaştırılır; fark varsa güncelleme yapılır.
 *
 * @param pageNodes Tüm sayfa node'ları
 * @param kind 'header' veya 'footer'
 * @param refJSON Uygulanacak referans JSON
 * @param isSyncingRef Senkronizasyon durumu (React ref)
 * @returns boolean (herhangi bir senkronizasyon yapıldı mı)
 */
export function applySectionJSONToAll(
  pageNodes: PageNode[],
  kind: SectionKind,
  refJSON: any[],
  isSyncingRef: { current: boolean }
): boolean {
  let didSync = false;
  for (const p of pageNodes) {
    const section = getSectionNode(p, kind);
    if (!(section instanceof ElementNode)) continue;
    // page-number olmayan çocukları al
    const children = section
      .getChildren()
      .filter((n: any) => typeof n.getType === 'function' && n.getType() !== 'page-number');
    const currJSON = children.map((n: any) => n.exportJSON());
    // Eğer referans JSON ile mevcut içerik farklıysa güncelle
    if (Array.isArray(refJSON) && !deepEqual(currJSON, refJSON)) {
      isSyncingRef.current = true;
      didSync = true;
      section.clear();
      // Her bir referans çocuğu için uygun Lexical node oluştur
      refJSON.forEach((childJSON: any) => {
        const type = childJSON.type;
        if (type === 'paragraph') {
          const para = new ParagraphNode();
          if (Array.isArray(childJSON.children)) {
            childJSON.children.forEach((grandChild: any) => {
              if (typeof grandChild === 'object' && grandChild !== null && 'type' in grandChild) {
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
  }
  return didSync;
}

/**
 * Basit serialized node objesini, ilgili Lexical node instance'ına çevirir.
 * Sadece paragraph, text ve linebreak tipleri desteklenir.
 * @param json JSON node objesi
 * @returns Lexical node instance'ı veya null
 */
export function importSerializedNode(json: any): any | null {
  if (json === null || json === undefined) return null;
  if (typeof json.type !== 'string') return null;
  if (json.type === 'paragraph') {
    const para = new ParagraphNode();
    if (Array.isArray(json.children)) {
      json.children.forEach((grandChild: any) => {
        const imported = importSerializedNode(grandChild);
        if (imported != null && typeof para.append === 'function') para.append(imported);
      });
    }
    return para;
  }
  if (json.type === 'text') {
    const textVal = (json as { text?: string }).text;
    return new TextNode(textVal ?? '');
  }
  if (json.type === 'linebreak') {
    return new LineBreakNode();
  }
  return null;
}
