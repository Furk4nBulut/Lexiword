import { ElementNode, SerializedElementNode } from 'lexical';
import * as React from 'react';

export type SerializedPageNode = SerializedElementNode & {
  type: 'page';
  version: 1;
};

export class PageNode extends ElementNode {
  static getType(): string {
    return 'page';
  }

  static clone(node: PageNode): PageNode {
    return new PageNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-page';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageNode): PageNode {
    return new PageNode();
  }

  exportJSON(): SerializedPageNode {
    return {
      ...super.exportJSON(),
      type: 'page',
      version: 1,
    };
  }
}
