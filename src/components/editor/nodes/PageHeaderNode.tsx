
import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';


export type SerializedPageHeaderNode = SerializedElementNode & {
  type: 'page-header';
  version: 1;
};


// PageHeaderNode: Sayfa başlığını (header) temsil eden Lexical ElementNode sınıfı.
// Header'ın içeriği bir paragraf node olarak tutulur.
export class PageHeaderNode extends ElementNode {
  static getType(): string {
    return 'page-header';
  }

  static clone(node: PageHeaderNode): PageHeaderNode {
    return new PageHeaderNode(node.__key);
  }

  constructor(key?: string) {
    super(key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-header';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    return dom;
  }

  updateDOM(): boolean {
    return false;
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
