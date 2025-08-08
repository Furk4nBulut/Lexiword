import {
  $applyNodeReplacement,
  $createParagraphNode,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type SerializedElementNode,
  type Spread
} from 'lexical';
import {
  $createContentNode,
  $createFooterNode,
  $createHeaderNode,
  ContentNode,
  FooterNode,
  HeaderNode
} from '../page-section/PageSectionNodes';

export type SerializedPageNode = Spread<
  {
    type: 'page';
    version: 2;
  },
  SerializedElementNode
>;

export class PageNode extends ElementNode {
  static getType(): string {
    return 'page';
  }

  static clone(node: PageNode): PageNode {
    return new PageNode(node.__key);
  }

  // No constructor needed

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-container';
    container.setAttribute('data-lexical-page', 'true');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    const sentinel = document.createElement('div');
    sentinel.className = 'page-observer-target';
    sentinel.setAttribute('aria-hidden', 'true');
    container.appendChild(sentinel);
    return container;
  }

  updateDOM(_prevNode: PageNode, _dom: HTMLElement): boolean {
    return false;
  }

  static importJSON(_serializedNode: SerializedPageNode): PageNode {
    return $createPageNode();
  }

  exportJSON(): SerializedPageNode {
    return {
      ...super.exportJSON(),
      type: 'page',
      version: 2
    };
  }
}

export function $createPageNode(): PageNode {
  const pageNode = new PageNode();
  const header = $createHeaderNode(false);
  const content = $createContentNode(true);
  const footer = $createFooterNode(false);
  pageNode.append(header);
  pageNode.append(content);
  pageNode.append(footer);
  return $applyNodeReplacement(pageNode);
}

export function $isPageNode(node: LexicalNode | null | undefined): node is PageNode {
  return node instanceof PageNode;
}
