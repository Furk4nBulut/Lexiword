import { $createParagraphNode, ElementNode, SerializedElementNode } from 'lexical';
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

  decorate(): JSX.Element | null {
    return null;
  }

  static createSection(editor: any) {
    editor.update(() => {
      const root = editor.getRootElement();
      if (root) {
        // Yeni bir PageContentNode ekle
        const contentNode = editor._nodeMap.get('PageContentNode')?.constructor?.name === 'PageContentNode'
          ? editor._nodeMap.get('PageContentNode')
          : null;
        if (contentNode) {
          // Eğer zaten bir content node varsa, yeni bir paragraf ekle
          contentNode.append($createParagraphNode());
        } else {
          // Yoksa yeni bir content node ekle
          const newContent = editor._nodeMap.get('PageContentNode')?.constructor?.name === 'PageContentNode'
            ? editor._nodeMap.get('PageContentNode')
            : null;
          if (newContent) {
            newContent.append($createParagraphNode());
            root.append(newContent);
          }
        }
      }
    });
  }
}
