import { TextNode, type SerializedTextNode, type EditorConfig } from 'lexical';

export type SerializedPageNumberNode = SerializedTextNode & {
  type: 'page-number';
  version: 1;
  pageNumber: number;
};

export class PageNumberNode extends TextNode {
  // PageNumberNode'u normal bir karakter gibi silinebilir yapmak için
  isSimpleText(): boolean {
    return true;
  }
  __pageNumber: number;

  constructor(pageNumber: number = 1, key?: string) {
    // Başlangıçta sayfa numarası metniyle başlat, hem efekt hem görünürlük için
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
  dom.textContent = this.getTextContent();
  dom.setAttribute('data-lexical-node-key', this.getKey());
  return dom;
  }

  updateDOM(prevNode: PageNumberNode, dom: HTMLElement): boolean {
    // TextNode gibi davranması için, textContent'i güncelle
    if (prevNode.getTextContent() !== this.getTextContent()) {
      dom.textContent = this.getTextContent();
    }
    // Key her zaman güncellensin, böylece silinmez
    dom.setAttribute('data-lexical-node-key', this.getKey());
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