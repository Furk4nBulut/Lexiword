import {
  $applyNodeReplacement,
  $createParagraphNode,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread
} from 'lexical';

export type SerializedPageNode = Spread<
  {
    type: 'page';
    version: 1;
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

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-container';
    container.setAttribute('data-lexical-page', 'true');

    // Invisible sentinel at the bottom for IntersectionObserver
    const sentinel = document.createElement('div');
    sentinel.className = 'page-observer-target';
    sentinel.setAttribute('aria-hidden', 'true');

    // Position sentinel within the container
    container.appendChild(sentinel);

    return container;
  }

  updateDOM(_prevNode: PageNode, _dom: HTMLElement): boolean {
    // No dynamic updates required for now
    return false;
  }

  static importJSON(_serializedNode: SerializedPageNode): PageNode {
    return $createPageNode();
  }

  exportJSON(): SerializedPageNode {
    return {
      ...super.exportJSON(),
      type: 'page',
      version: 1
    };
  }
}

export function $createPageNode(): PageNode {
  const pageNode = new PageNode();
  const paragraph = $createParagraphNode();
  pageNode.append(paragraph);
  return $applyNodeReplacement(pageNode);
}

export function $isPageNode(node: LexicalNode | null | undefined): node is PageNode {
  return node instanceof PageNode;
} 