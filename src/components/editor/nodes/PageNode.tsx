import { ElementNode, SerializedElementNode } from 'lexical';
import { PageHeaderNode } from './PageHeaderNode';
import { PageFooterNode } from './PageFooterNode';
import { PageContentNode } from './PageContentNode';

export type SerializedPageNode = {
  type: 'page';
  version: 1;
} & SerializedElementNode;

export class PageNode extends ElementNode {
  static getType(): string {
    return 'page';
  }

  static clone(node: PageNode): PageNode {
    return new PageNode(node.__key);
  }

  constructor(key?: string) {
    super(key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-page';
    dom.style.display = 'flex';
    dom.style.flexDirection = 'column';
    dom.style.width = '210mm';
    dom.style.height = '297mm';
    dom.style.background = '#fff';
    dom.style.boxShadow = '0 0 8px #ccc';
    dom.style.position = 'relative';
    dom.style.overflow = 'hidden';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageNode): PageNode {
    const node = new PageNode();
    return node;
  }

  exportJSON(): SerializedPageNode {
    return {
      ...super.exportJSON(),
      type: 'page',
      version: 1,
    };
  }

  // Always ensure header, content, footer exist as children
  appendInitialChildren() {
    // Sıralama: header -> content -> footer (section her zaman ortada)
    let header = this.getChildren().find(child => child.getType() === 'page-header');
    let content = this.getChildren().find(child => child.getType() === 'page-content');
    let footer = this.getChildren().find(child => child.getType() === 'page-footer');
    if (!header) header = new PageHeaderNode('', undefined, false);
    if (!content) content = new PageContentNode();
    if (!footer) footer = new PageFooterNode('', undefined, false);
    // Tüm çocukları kaldır ve doğru sırayla ekle
    this.getChildren().forEach(child => child.remove());
    this.append(header);
    this.append(content);
    this.append(footer);
  }

  getHeaderNode(): PageHeaderNode | undefined {
    return this.getChildren().find(child => child.getType() === 'page-header') as PageHeaderNode;
  }
  getFooterNode(): PageFooterNode | undefined {
    return this.getChildren().find(child => child.getType() === 'page-footer') as PageFooterNode;
  }

  addHeader() {
    const header = this.getHeaderNode();
    if (header) header.setVisible(true);
  }
  removeHeader() {
    const header = this.getHeaderNode();
    if (header) header.setVisible(false);
  }
  addFooter() {
    const footer = this.getFooterNode();
    if (footer) footer.setVisible(true);
  }
  removeFooter() {
    const footer = this.getFooterNode();
    if (footer) footer.setVisible(false);
  }

  // Section (content) asla silinemez: removeChild ve removeChildren tamamen engelleniyor
  removeChild(child: ElementNode): void {
    if (child.getType() === 'page-content') {
      // Section silinemez, hiçbir şey yapma
      return;
    }
    super.removeChild(child);
  }

  removeChildren(predicate?: (child: ElementNode) => boolean): void {
    // Section'ı asla silme
    super.removeChildren(child => {
      if (child.getType() === 'page-content') return false;
      return predicate ? predicate(child) : true;
    });
  }
}
