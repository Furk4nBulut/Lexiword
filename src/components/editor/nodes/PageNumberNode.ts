import { TextNode, type SerializedTextNode, type EditorConfig } from 'lexical';

export type SerializedPageNumberNode = SerializedTextNode & {
  type: 'page-number';
  version: 1;
};

export class PageNumberNode extends TextNode {
  // Bu node'un önüne veya arkasına caret konulamaz, içine de caret konulamaz
  canInsertTextAfter(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  isSegmented(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  isToken(): boolean {
    return true;
  }
  // Bu node hiçbir şekilde düzenlenemez

  isSimpleText(): boolean {
    return false;
  }

  isTextEntity(): boolean {
    return true;
  }

  isEditable(): boolean {
    return false;
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
    dom.setAttribute('contenteditable', 'false');
    dom.classList.add('page-number-node');

    // Caret, selection ve input event'lerini tamamen engelle
    dom.addEventListener('mousedown', (e: Event) => {
      e.preventDefault();
    });
    dom.addEventListener('keydown', (e: Event) => {
      e.preventDefault();
    });
    dom.addEventListener('beforeinput', (e: Event) => {
      e.preventDefault();
    });
    dom.addEventListener('input', (e: Event) => {
      e.preventDefault();
    });
    dom.addEventListener('paste', (e: Event) => {
      e.preventDefault();
    });
    dom.addEventListener('drop', (e: Event) => {
      e.preventDefault();
    });
    dom.addEventListener('focus', (e: Event) => {
      e.preventDefault();
    });
    return dom;
  }

  updateDOM(prevNode: PageNumberNode, dom: HTMLElement): boolean {
    // Her güncellemede textContent'i ata, böylece silme efekti anında görünür
    dom.textContent = this.getTextContent();
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
