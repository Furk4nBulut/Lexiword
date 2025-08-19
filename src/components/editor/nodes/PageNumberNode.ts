import { TextNode, type SerializedTextNode, type EditorConfig } from 'lexical';

export type SerializedPageNumberNode = SerializedTextNode & {
  type: 'page-number';
  version: 1;
  pageNumber: number;
};

export class PageNumberNode extends TextNode {
  __pageNumber: number;

  constructor(pageNumber: number = 1, key?: string) {
    super(String(pageNumber), key);
    this.__pageNumber = pageNumber;
  }

  static getType(): string {
    return 'page-number';
  }

  static clone(node: PageNumberNode): PageNumberNode {
    return new PageNumberNode(node.__pageNumber, node.__key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'a4-page-number';
    dom.textContent = String(this.__pageNumber);
    dom.style.display = 'inline';
    dom.style.verticalAlign = 'baseline';
    dom.style.fontFamily = 'inherit';
    dom.style.fontSize = 'inherit';
    dom.style.color = 'inherit';
    dom.style.lineHeight = 'inherit';
    dom.style.userSelect = 'none';
    dom.setAttribute('data-lexical-node-key', this.getKey());
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

export function $createPageNumberNode(pageNumber: number): PageNumberNode {
  return new PageNumberNode(pageNumber);
}

export default PageNumberNode;