import {
  $applyNodeReplacement,
  $createParagraphNode,
  DecoratorNode,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread
} from 'lexical';

export type PageSectionMode = 'header' | 'content' | 'footer';

// Shared interface for section nodes containing an editable flag
interface SerializedSectionNodeBase extends SerializedElementNode {
  editable?: boolean;
  visible?: boolean;
}

export type SerializedHeaderNode = Spread<
  SerializedSectionNodeBase & {
    type: 'page-header';
    version: 1;
  },
  SerializedElementNode
>;

export type SerializedContentNode = Spread<
  SerializedSectionNodeBase & {
    type: 'page-content';
    version: 1;
  },
  SerializedElementNode
>;

export type SerializedFooterNode = Spread<
  SerializedSectionNodeBase & {
    type: 'page-footer';
    version: 1;
  },
  SerializedElementNode
>;

abstract class BaseSectionNode<TSerialized extends SerializedSectionNodeBase> extends ElementNode {
  __editable: boolean;
  __visible: boolean;

  constructor(editable: boolean, visible: boolean, key?: NodeKey) {
    super(key);
    this.__editable = editable;
    this.__visible = visible;
  }

  isEditableSection(): boolean {
    return this.getLatest().__editable;
  }

  setEditable(editable: boolean): void {
    const self = this.getWritable() as BaseSectionNode<TSerialized>;
    self.__editable = editable;
  }

  isVisibleSection(): boolean {
    return this.getLatest().__visible;
  }

  setVisible(visible: boolean): void {
    const self = this.getWritable() as BaseSectionNode<TSerialized>;
    self.__visible = visible;
  }

  exportJSON(): TSerialized {
    return {
      ...super.exportJSON(),
      editable: this.getLatest().__editable,
      visible: this.getLatest().__visible
    } as TSerialized;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const prevEditable = prevNode.__editable;
    const nextEditable = this.__editable;
    const prevVisible = prevNode.__visible;
    const nextVisible = this.__visible;
    if (prevEditable !== nextEditable) {
      dom.setAttribute('contenteditable', nextEditable ? 'true' : 'false');
      if (nextEditable) {
        dom.classList.add('page-section--editing');
      } else {
        dom.classList.remove('page-section--editing');
      }
    }
    if (prevVisible !== nextVisible) {
      dom.setAttribute('data-visible', nextVisible ? 'true' : 'false');
      (dom as HTMLElement).style.display = nextVisible ? '' : 'none';
    }
    return false;
  }
}

export class HeaderNode extends BaseSectionNode<SerializedHeaderNode> {
  static getType(): string {
    return 'page-header';
  }

  static clone(node: HeaderNode): HeaderNode {
    return new HeaderNode(node.__editable, node.__visible, node.__key);
  }

  static importJSON(serializedNode: SerializedHeaderNode): HeaderNode {
    const node = new HeaderNode(Boolean(serializedNode.editable), Boolean(serializedNode.visible));
    return $applyNodeReplacement(node);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-section page-section--header';
    container.setAttribute('data-lexical-page-section', 'header');
    container.setAttribute('contenteditable', this.__editable ? 'true' : 'false');
    container.setAttribute('data-visible', this.__visible ? 'true' : 'false');
    (container as HTMLElement).style.display = this.__visible ? '' : 'none';
    if (this.__editable) container.classList.add('page-section--editing');
    return container;
  }
}

export class ContentNode extends BaseSectionNode<SerializedContentNode> {
  static getType(): string {
    return 'page-content';
  }

  static clone(node: ContentNode): ContentNode {
    return new ContentNode(node.__editable, node.__visible, node.__key);
  }

  static importJSON(serializedNode: SerializedContentNode): ContentNode {
    const node = new ContentNode(Boolean(serializedNode.editable), Boolean(serializedNode.visible));
    return $applyNodeReplacement(node);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-section page-section--content';
    container.setAttribute('data-lexical-page-section', 'content');
    container.setAttribute('contenteditable', this.__editable ? 'true' : 'false');
    container.setAttribute('data-visible', this.__visible ? 'true' : 'false');
    (container as HTMLElement).style.display = this.__visible ? '' : 'none';
    if (this.__editable) container.classList.add('page-section--editing');
    return container;
  }
}

export class FooterNode extends BaseSectionNode<SerializedFooterNode> {
  static getType(): string {
    return 'page-footer';
  }

  static clone(node: FooterNode): FooterNode {
    return new FooterNode(node.__editable, node.__visible, node.__key);
  }

  static importJSON(serializedNode: SerializedFooterNode): FooterNode {
    const node = new FooterNode(Boolean(serializedNode.editable), Boolean(serializedNode.visible));
    return $applyNodeReplacement(node);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const container = document.createElement('div');
    container.className = 'page-section page-section--footer';
    container.setAttribute('data-lexical-page-section', 'footer');
    container.setAttribute('contenteditable', this.__editable ? 'true' : 'false');
    container.setAttribute('data-visible', this.__visible ? 'true' : 'false');
    (container as HTMLElement).style.display = this.__visible ? '' : 'none';
    if (this.__editable) container.classList.add('page-section--editing');
    return container;
  }
}

export function $createHeaderNode(editable = false, visible = false): HeaderNode {
  const node = new HeaderNode(editable, visible);
  // Put a paragraph inside for caret placement
  node.append($createParagraphNode());
  return $applyNodeReplacement(node);
}

export function $createContentNode(editable = true, visible = true): ContentNode {
  const node = new ContentNode(editable, visible);
  node.append($createParagraphNode());
  return $applyNodeReplacement(node);
}

export function $createFooterNode(editable = false, visible = false): FooterNode {
  const node = new FooterNode(editable, visible);
  node.append($createParagraphNode());
  return $applyNodeReplacement(node);
}

export function $isHeaderNode(node: LexicalNode | null | undefined): node is HeaderNode {
  return node instanceof HeaderNode;
}

export function $isContentNode(node: LexicalNode | null | undefined): node is ContentNode {
  return node instanceof ContentNode;
}

export function $isFooterNode(node: LexicalNode | null | undefined): node is FooterNode {
  return node instanceof FooterNode;
} 