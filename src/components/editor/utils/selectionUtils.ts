/**
 * selectionUtils.ts
 *
 * Küçük yardımcı: Seçimin tamamen `.a4-content` içinde olup olmadığını kontrol eder.
 */
export function isSelectionFullyInA4Content(selection?: Selection | null): boolean {
  const sel = selection ?? (typeof window !== 'undefined' ? window.getSelection() : null);
  if (sel === null) return false;
  if (sel.isCollapsed) return false;
  for (let i = 0; i < sel.rangeCount; i++) {
    const range = sel.getRangeAt(i);
    let startContainer: Node | null = range.startContainer ?? null;
    let endContainer: Node | null = range.endContainer ?? null;
    if (startContainer !== null && startContainer.nodeType === Node.TEXT_NODE) {
      startContainer = (startContainer as Text).parentElement as Node | null;
    }
    if (endContainer !== null && endContainer.nodeType === Node.TEXT_NODE) {
      endContainer = (endContainer as Text).parentElement as Node | null;
    }
    if (!(startContainer instanceof HTMLElement) || !(endContainer instanceof HTMLElement))
      return false;
    if (
      startContainer.closest('.a4-content') === null ||
      endContainer.closest('.a4-content') === null
    ) {
      return false;
    }
  }
  return true;
}
