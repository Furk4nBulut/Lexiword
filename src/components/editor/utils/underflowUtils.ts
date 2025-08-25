import type { LexicalNode } from 'lexical';

/**
 * underflowUtils
 * - getSelectedContentBlockCount(editor): seçili blok sayısını hesaplar (content içindeki)
 * - pullBlocksUp(targetContent, sourceContent, count): sourceContent'in ilk `count` blokunu alıp targetContent'e ekler
 */

/**
 * Editörde seçili olan 'page-content' tipindeki blokların sayısını döndürür.
 * Eğer seçim yoksa veya blok bulunamazsa, varsayılan olarak 1 döner.
 * @param editor Lexical editör nesnesi
 * @returns Seçili blok sayısı
 */
export function getSelectedContentBlockCount(editor: any): number {
  let selectedBlockCount = 1; // Varsayılan değer
  try {
    editor.getEditorState().read(() => {
      const selection = editor.getEditorState()._selection;
      // Seçim varsa ve getNodes fonksiyonu mevcutsa
      if (selection != null && typeof selection.getNodes === 'function') {
        const nodes = selection.getNodes();
        // Sadece 'page-content' tipindeki blokları say
        const count = nodes.filter((n: any) => {
          const parent = n.getParent?.();
          return parent?.getType?.() === 'page-content';
        }).length;
        if (count > 0) selectedBlockCount = count;
      }
    });
  } catch (e) {
    // Hata olursa yoksay
  }
  return selectedBlockCount;
}

/**
 * sourceContent içindeki ilk 'count' kadar bloğu alıp targetContent'e ekler.
 * Her blok, sourceContent'ten çıkarılır ve targetContent'e eklenir.
 * @param targetContent Blokların ekleneceği hedef içerik
 * @param sourceContent Blokların alınacağı kaynak içerik
 * @param count Taşınacak blok sayısı
 */
export function pullBlocksUp(
  targetContent: LexicalNode,
  sourceContent: LexicalNode,
  count: number
): void {
  for (let j = 0; j < count; j++) {
    const firstBlock = sourceContent.getChildren()[0]; // İlk bloğu al
    if (firstBlock != null) {
      firstBlock.remove(); // Kaynaktan çıkar
      targetContent.append(firstBlock); // Hedefe ekle
    } else {
      break; // Kaynakta blok kalmadıysa döngüyü bitir
    }
  }
}
