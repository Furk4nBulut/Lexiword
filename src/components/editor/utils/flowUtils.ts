import type { LexicalNode } from 'lexical'; // LexicalNode tipini içe aktar

/**
 * Klonlama yardımcıları ve DOM metrik yardımcıları için küçük bir util modülü.
 * Bu fonksiyonlar `PageAutoSplitPlugin` tarafından paylaşılarak tekrar kullanım sağlanır.
 */

/**
 * Verilen sectionNode'u (ve çocuklarını) klonlar.
 * @param sectionNode Klonlanacak LexicalNode
 * @returns Klonlanmış yeni node veya null
 */
export function cloneSection<T extends LexicalNode>(sectionNode: T | null): T | null {
  if (sectionNode == null) return null; // Eğer node yoksa null döndür
  const SectionClass = sectionNode.constructor as new () => T; // Node'un sınıfını al
  const clonedSection = new SectionClass(); // Yeni bir instance oluştur
  sectionNode.getChildren().forEach((child: LexicalNode | null | undefined) => {
    // Tüm çocukları dolaş
    if (child !== null && child !== undefined && typeof (child as any).clone === 'function') {
      // Çocuk klonlanabilir mi?
      clonedSection.append((child as any).clone()); // Klonlanmış çocuğu ekle
    }
  });
  return clonedSection; // Klonlanmış section'u döndür
}

/**
 * Sayfa içerik bölümünün DOM metriklerini döndürür.
 * @param editor Lexical editor instance (kısmi any olarak tiplenir)
 * @param pageEl Sayfa DOM elementi
 * @returns İçerik elementinin ve metriklerinin bulunduğu nesne
 */
export function getContentMetrics(
  editor: any, // Editor instance'ı
  pageEl: HTMLElement // Sayfa DOM elementi
): {
  el: HTMLElement | null; // İçerik elementi
  top: number; // İçeriğin üst noktası (px)
  bottom: number; // İçeriğin alt noktası (px)
  height: number; // İçeriğin yüksekliği (px)
  paddingTop: number; // Üst padding (px)
  paddingBottom: number; // Alt padding (px)
} {
  const el = pageEl.querySelector('[data-lexical-page-section="content"]'); // İçerik elementini bul
  const contentEl = el instanceof HTMLElement ? el : null; // HTMLElement mi kontrol et
  const target = contentEl !== null && contentEl !== undefined ? contentEl : pageEl; // Hedef element
  const rect = target.getBoundingClientRect(); // Elementin konum ve boyutunu al
  const styles = window.getComputedStyle(target); // CSS stillerini al
  let paddingTop = parseFloat(styles.paddingTop); // Üst padding'i al
  let paddingBottom = parseFloat(styles.paddingBottom); // Alt padding'i al
  if (Number.isNaN(paddingTop)) paddingTop = 0; // NaN ise sıfırla
  if (Number.isNaN(paddingBottom)) paddingBottom = 0; // NaN ise sıfırla
  const top = rect.top + paddingTop; // Gerçek üst nokta
  const bottom = rect.bottom - paddingBottom; // Gerçek alt nokta
  return { el: contentEl, top, bottom, height: bottom - top, paddingTop, paddingBottom }; // Sonuç nesnesi
}

/**
 * İçerik elementinin gerçek scroll yüksekliğini döndürür (paddingler hariç).
 * @param targetEl Hedef içerik elementi
 * @param paddingTop Üst padding (px)
 * @param paddingBottom Alt padding (px)
 * @returns Scroll yüksekliği (px)
 */
export function getContentScrollHeight(
  targetEl: HTMLElement, // Hedef içerik elementi
  paddingTop: number, // Üst padding
  paddingBottom: number // Alt padding
): number {
  return targetEl.scrollHeight - paddingTop - paddingBottom; // Gerçek scroll yüksekliği
}
