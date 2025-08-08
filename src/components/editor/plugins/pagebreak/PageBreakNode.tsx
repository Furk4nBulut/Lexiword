import {
  $applyNodeReplacement,
  $createParagraphNode,
  ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread
} from 'lexical';

export type SerializedPageBreakNode = Spread<
{
  pageNumber: number;
},
SerializedElementNode
>;

export class PageBreakNode extends ElementNode {
  __pageNumber: number;

  static getType(): string {
    return 'page-break';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__pageNumber, node.__key);
  }

  constructor(pageNumber: number, key?: NodeKey) {
    super(key);
    this.__pageNumber = pageNumber;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-page-break', 'true');
    element.setAttribute('data-page-number', this.__pageNumber.toString());
    element.className = 'page-break';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode(serializedNode.pageNumber);
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      ...super.exportJSON(),
      pageNumber: this.__pageNumber,
      type: 'page-break'
    };
  }
}

export function $createPageBreakNode(pageNumber: number): PageBreakNode {
  const pageBreakNode = new PageBreakNode(pageNumber);
  const paragraph = $createParagraphNode();
  pageBreakNode.append(paragraph);
  return $applyNodeReplacement(pageBreakNode);
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
