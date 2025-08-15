import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';

export function $createPageNumberNode(pageNumber: number): PageNumberNode {
  return new PageNumberNode(pageNumber);
}



export type SerializedPageNumberNode = SerializedElementNode & {
  type: 'page-number';
  version: 1;
  pageNumber: number;
};

export class PageNumberNode extends ElementNode {
  __pageNumber: number;

  constructor(pageNumber: number = 1, key?: string) {
    super(key);
    this.__pageNumber = pageNumber;
  }

  static getType(): string {
    return 'page-number';
  }

  static clone(node: PageNumberNode): PageNumberNode {
    return new PageNumberNode(node.__pageNumber, node.__key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-page-number';
    dom.textContent = String(this.__pageNumber);
    dom.style.textAlign = 'center';
    dom.style.color = '#888';
    dom.style.fontSize = '12px';
    dom.style.margin = '8px 0';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    dom.setAttribute('contenteditable', 'false');
    return dom;
  }

  updateDOM(prevNode: PageNumberNode, dom: HTMLElement): boolean {
    if (prevNode.__pageNumber !== this.__pageNumber) {
      dom.textContent = String(this.__pageNumber);
    }
    return false;
  }

  static importJSON(serializedNode: SerializedPageNumberNode): PageNumberNode {
    return new PageNumberNode(serializedNode.pageNumber);
  }

  exportJSON(): SerializedPageNumberNode {
    return {
      ...super.exportJSON(),
      type: 'page-number',
      version: 1,
      pageNumber: this.__pageNumber
    };
  }

}

export default PageNumberNode;
