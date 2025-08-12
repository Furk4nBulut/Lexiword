import { ElementNode, type SerializedElementNode } from 'lexical';
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
    return new PageNode({ key: node.__key });
  }

  constructor({ key }: { key?: string }) {
    super(key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-page';
    dom.style.display = 'flex';
    dom.style.flexDirection = 'column';
    // Use px to be consistent with runtime measurements (96dpi approx)
    dom.style.width = '794px'; // 210mm ~ 8.27in * 96
    dom.style.height = '1122px'; // 297mm ~ 11.69in * 96
    dom.style.background = '#fff';
    dom.style.position = 'relative';
    dom.style.overflow = 'hidden';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageNode): PageNode {
    const node = new PageNode({});
    return node;
  }

  exportJSON(): SerializedPageNode {
    return {
      ...super.exportJSON(),
      type: 'page',
      version: 1
    };
  }

  // Always ensure header, content, footer exist as children
  ensureHeaderFooterContentChildren(): void {
    // Sıralama: header -> content -> footer (section her zaman ortada)
    let header = this.getChildren().find((child) => child.getType() === 'page-header');
    let content = this.getChildren().find((child) => child.getType() === 'page-content');
    let footer = this.getChildren().find((child) => child.getType() === 'page-footer');
    if (header == null) header = new PageHeaderNode('', undefined, false);
    if (content == null) content = new PageContentNode();
    if (footer == null) footer = new PageFooterNode('', undefined, false);
    // Tüm çocukları kaldır ve doğru sırayla ekle
    this.getChildren().forEach((child) => {
      child.remove();
    });
    this.append(header);
    this.append(content);
    this.append(footer);
  }

  appendInitialChildren(): void {
    this.ensureHeaderFooterContentChildren();
  }

  getHeaderNode(): PageHeaderNode | undefined {
    return this.getChildren().find((child) => child.getType() === 'page-header') as PageHeaderNode;
  }

  getFooterNode(): PageFooterNode | undefined {
    return this.getChildren().find((child) => child.getType() === 'page-footer') as PageFooterNode;
  }
}
