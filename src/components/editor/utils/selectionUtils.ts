/**
 * selectionUtils.ts
 *
 * Seçimin tamamen `.a4-content` elementi içinde olup olmadığını kontrol eden yardımcı fonksiyon.
 */

/**
 * Verilen selection nesnesinin (veya window.getSelection()) tamamen .a4-content içinde olup olmadığını kontrol eder.
 *
 * @param selection Kontrol edilecek Selection nesnesi (opsiyonel, verilmezse window.getSelection() kullanılır)
 * @returns Seçim tamamen .a4-content içindeyse true, aksi halde false
 */
export function isSelectionFullyInA4Content(selection?: Selection | null): boolean {
  // Selection nesnesini al (parametre yoksa window'dan)
  const sel = selection ?? (typeof window !== 'undefined' ? window.getSelection() : null);
  if (sel === null) return false; // Seçim yoksa false
  if (sel.isCollapsed) return false; // Seçim boşsa (sadece imleç varsa) false
  // Tüm range'ler için kontrol et
  for (let i = 0; i < sel.rangeCount; i++) {
    const range = sel.getRangeAt(i);
    let startContainer: Node | null = range.startContainer ?? null;
    let endContainer: Node | null = range.endContainer ?? null;
    // Eğer başlangıç veya bitiş bir text node ise, parentElement'e çık
    if (startContainer !== null && startContainer.nodeType === Node.TEXT_NODE) {
      startContainer = (startContainer as Text).parentElement as Node | null;
    }
    if (endContainer !== null && endContainer.nodeType === Node.TEXT_NODE) {
      endContainer = (endContainer as Text).parentElement as Node | null;
    }
    // Her iki container da HTMLElement olmalı
    if (!(startContainer instanceof HTMLElement) || !(endContainer instanceof HTMLElement)) {
      return false;
    }
    // Her iki container da .a4-content içinde mi?
    if (
      startContainer.closest('.a4-content') === null ||
      endContainer.closest('.a4-content') === null
    ) {
      return false;
    }
  }
  // Tüm range'ler uygunsa true
  return true;
}
