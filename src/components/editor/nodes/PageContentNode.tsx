import { ElementNode, SerializedElementNode } from 'lexical';
import * as React from 'react';

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

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-content';
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
      version: 1,
    };
  }
}
