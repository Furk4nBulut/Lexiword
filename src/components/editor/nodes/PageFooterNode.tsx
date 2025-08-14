// ...existing code...
import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';
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



  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    return dom;
  }

  updateDOM(): boolean {
    return false;
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
