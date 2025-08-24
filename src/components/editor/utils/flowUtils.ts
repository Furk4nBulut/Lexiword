import type { LexicalNode } from 'lexical';

/**
 * Klonlama yardımcıları ve DOM metrik yardımcıları için küçük bir util modülü.
 * Bu fonksiyonlar `PageAutoSplitPlugin` tarafından paylaşılarak tekrar kullanım sağlanır.
 */

export function cloneSection<T extends LexicalNode>(sectionNode: T | null): T | null {
  if (sectionNode == null) return null;
  const SectionClass = sectionNode.constructor as new () => T;
  const clonedSection = new SectionClass();
  sectionNode.getChildren().forEach((child: LexicalNode | null | undefined) => {
    if (child !== null && child !== undefined && typeof (child as any).clone === 'function') {
      clonedSection.append((child as any).clone());
    }
  });
  return clonedSection;
}

/**
 * Sayfa içerik bölümünün DOM metriklerini döndürür.
 * @param editor - Lexical editor instance (kısmi any olarak tiplenir)
 * @param pageEl - Sayfa DOM elementi
 */
export function getContentMetrics(
  editor: any,
  pageEl: HTMLElement
): {
  el: HTMLElement | null;
  top: number;
  bottom: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
} {
  const el = pageEl.querySelector('[data-lexical-page-section="content"]');
  const contentEl = el instanceof HTMLElement ? el : null;
  const target = contentEl !== null && contentEl !== undefined ? contentEl : pageEl;
  const rect = target.getBoundingClientRect();
  const styles = window.getComputedStyle(target);
  let paddingTop = parseFloat(styles.paddingTop);
  let paddingBottom = parseFloat(styles.paddingBottom);
  if (Number.isNaN(paddingTop)) paddingTop = 0;
  if (Number.isNaN(paddingBottom)) paddingBottom = 0;
  const top = rect.top + paddingTop;
  const bottom = rect.bottom - paddingBottom;
  return { el: contentEl, top, bottom, height: bottom - top, paddingTop, paddingBottom };
}

export function getContentScrollHeight(
  targetEl: HTMLElement,
  paddingTop: number,
  paddingBottom: number
): number {
  return targetEl.scrollHeight - paddingTop - paddingBottom;
}
