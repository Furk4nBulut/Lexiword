
import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';

// Edit mode kontrolü için global değişken (plugin tarafından set edilecek)
let globalHeaderFooterEditMode = false;
export function setHeaderFooterEditModeForNodes(val: boolean): void {
  globalHeaderFooterEditMode = val;
}
// ...existing code...
export type SerializedPageHeaderNode = SerializedElementNode & {
  type: 'page-header';
  version: 1;
};
// ...existing code...
// ...existing code...
// PageHeaderNode: Sayfa başlığını (header) temsil eden Lexical ElementNode sınıfı.
// Header'ın içeriği bir paragraf node olarak tutulur.
export class PageHeaderNode extends ElementNode {
  static getType(): string {
    return 'page-header';
  }

  static clone(node: PageHeaderNode): PageHeaderNode {
    return new PageHeaderNode(node.__key);
  }
// ...existing code...

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-header';
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

  static importJSON(serializedNode: SerializedPageHeaderNode): PageHeaderNode {
    return new PageHeaderNode();
  }

  exportJSON(): SerializedPageHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'page-header',
      version: 1
    };
  }
}
