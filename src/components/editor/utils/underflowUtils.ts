import type { LexicalNode } from 'lexical';

/**
 * underflowUtils
 * - getSelectedContentBlockCount(editor): seçili blok sayısını hesaplar (content içindeki)
 * - pullBlocksUp(targetContent, sourceContent, count): sourceContent'in ilk `count` blokunu alıp targetContent'e ekler
 */
export function getSelectedContentBlockCount(editor: any): number {
  let selectedBlockCount = 1;
  try {
    editor.getEditorState().read(() => {
      const selection = editor.getEditorState()._selection;
      if (selection != null && typeof selection.getNodes === 'function') {
        const nodes = selection.getNodes();
        const count = nodes.filter((n: any) => {
          const parent = n.getParent?.();
          return parent?.getType?.() === 'page-content';
        }).length;
        if (count > 0) selectedBlockCount = count;
      }
    });
  } catch (e) {
    // ignore
  }
  return selectedBlockCount;
}

export function pullBlocksUp(
  targetContent: LexicalNode,
  sourceContent: LexicalNode,
  count: number
): void {
  for (let j = 0; j < count; j++) {
    const firstBlock = sourceContent.getChildren()[0];
    if (firstBlock != null) {
      firstBlock.remove();
      targetContent.append(firstBlock);
    } else {
      break;
    }
  }
}
