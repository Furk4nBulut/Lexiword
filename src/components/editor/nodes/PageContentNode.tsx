import { ElementNode, type SerializedElementNode } from 'lexical';

export type SerializedPageContentNode = SerializedElementNode & {
  type: 'page-content';
  version: 1;
};

export class PageContentNode extends ElementNode {
  static getType(): string {
    return 'page-content';
  }

  static clone(node: PageContentNode): PageContentNode {
    return new PageContentNode(node.__key);
  }

  // We need this constructor to forward the key to ElementNode for proper cloning behavior
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(key?: string) {
    super(key);
  }

  // Section'ın asla silinememesi için remove ve removeChild'ı override et
  remove(): void {
    // Hiçbir şey yapma, silinemez
  }

  removeChild(): void {
    // Hiçbir şey yapma, silinemez
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-content';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageContentNode): PageContentNode {
    return new PageContentNode();
  }

  exportJSON(): SerializedPageContentNode {
    return {
      ...super.exportJSON(),
      type: 'page-content',
      version: 1
    };
  }
}
