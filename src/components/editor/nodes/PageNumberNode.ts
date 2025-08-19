import { TextNode, type SerializedTextNode, type EditorConfig } from 'lexical';

export type SerializedPageNumberNode = SerializedTextNode & {
  type: 'page-number';
  version: 1;
};

export class PageNumberNode extends TextNode {
  isSimpleText(): boolean {
    return true;
  }

  constructor(text: string = '', key?: string) {
    super(text, key);
  }

  static getType(): string {
    return 'page-number';
  }

  static clone(node: PageNumberNode): PageNumberNode {
    return new PageNumberNode(node.getTextContent(), node.__key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.textContent = this.getTextContent();
    dom.setAttribute('data-lexical-node-key', this.getKey());
    dom.setAttribute('data-lexical-text', 'true');
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
    return new PageNumberNode(serializedNode.text);
  }

  exportJSON(): SerializedPageNumberNode {
    return {
      ...super.exportJSON(),
      type: 'page-number',
      version: 1
    };
  }
}

export function $createPageNumberNode(text: string): PageNumberNode {
  return new PageNumberNode(text);
}

export default PageNumberNode;
