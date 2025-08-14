
import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';

// Edit mode kontrolü için global değişken (plugin tarafından set edilecek)
let globalHeaderFooterEditMode = false;
export function setHeaderFooterEditModeForNodes(val: boolean): void {
  globalHeaderFooterEditMode = val;
}
// ...existing code...
export type SerializedPageFooterNode = SerializedElementNode & {
  type: 'page-footer';
  version: 1;
};
// ...existing code...
// ...existing code...
// PageFooterNode: Sayfa alt bilgisini (footer) temsil eden Lexical ElementNode sınıfı.
// Footer'ın içeriği bir paragraf node olarak tutulur.
export class PageFooterNode extends ElementNode {
  static getType(): string {
    return 'page-footer';
  }

  static clone(node: PageFooterNode): PageFooterNode {
    return new PageFooterNode(node.__key);
  }
// ...existing code...

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    // Sadece edit modunda düzenlenebilir
    dom.contentEditable = globalHeaderFooterEditMode ? 'true' : 'false';
    dom.setAttribute('tabIndex', '0');
    // Tıklama event'inin bubbling ile yukarı çıkmasını engelle
    dom.addEventListener('click', (e) => { e.stopPropagation(); });
    return dom;
  }

  updateDOM(): boolean {
    // Edit mode değiştiyse contentEditable güncellenmeli
    return true;
  }

  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    return new PageFooterNode();
  }

  exportJSON(): SerializedPageFooterNode {
    return {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1
    };
  }
}
