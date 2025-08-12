import { ElementNode, SerializedElementNode } from 'lexical';
import * as React from 'react';

export type SerializedPageFooterNode = SerializedElementNode & {
  type: 'page-footer';
  version: 1;
};

export class PageFooterNode extends ElementNode {
  static getType(): string {
    return 'page-footer';
  }

  static clone(node: PageFooterNode): PageFooterNode {
    return new PageFooterNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    return new PageFooterNode();
  }

  exportJSON(): SerializedPageFooterNode {
    return {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1,
    };
  }
}
