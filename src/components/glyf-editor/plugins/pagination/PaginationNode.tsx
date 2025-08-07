import {
  $applyNodeReplacement,
  $createParagraphNode,
  ElementNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
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

  getPageNumber(): number {
    return this.__pageNumber;
  }

  setPageNumber(pageNumber: number): void {
    const writable = this.getWritable();
    writable.__pageNumber = pageNumber;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-page-break', 'true');
    element.setAttribute('data-page-number', this.__pageNumber.toString());
    element.className = 'page-break';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: () => ({
        conversion: convertPageBreakElement,
        priority: 1
      })
    };
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    const { pageNumber } = serializedNode;
    return $createPageBreakNode(pageNumber);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-page-break', 'true');
    element.setAttribute('data-page-number', this.__pageNumber.toString());
    element.className = 'page-break';
    return { element };
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      ...super.exportJSON(),
      pageNumber: this.__pageNumber,
      type: 'page-break',
      version: 1
    };
  }

  canBeEmpty(): false {
    return false;
  }

  isInline(): false {
    return false;
  }
}

function convertPageBreakElement(node: HTMLElement): DOMConversionOutput {
  const pageNumberAttr = node.getAttribute('data-page-number');
  const pageNumber = pageNumberAttr != null ? parseInt(pageNumberAttr, 10) : 1;
  const pageBreakNode = $createPageBreakNode(pageNumber);
  return { node: pageBreakNode };
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
