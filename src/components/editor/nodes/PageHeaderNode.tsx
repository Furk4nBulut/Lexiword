import { ElementNode, SerializedElementNode } from 'lexical';
import * as React from 'react';

export type SerializedPageHeaderNode = SerializedElementNode & {
  type: 'page-header';
  version: 1;
};

export class PageHeaderNode extends ElementNode {
  static getType(): string {
    return 'page-header';
  }

  static clone(node: PageHeaderNode): PageHeaderNode {
    return new PageHeaderNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-header';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageHeaderNode): PageHeaderNode {
    return new PageHeaderNode();
  }

  exportJSON(): SerializedPageHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'page-header',
      version: 1,
    };
  }
}
