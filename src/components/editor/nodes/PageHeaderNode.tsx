import { PageSectionNode } from './PageSectionNode';
import { type SerializedElementNode } from 'lexical';

/**
 * Factory for creating a PageHeaderNode.
 */
export function $createPageHeaderNode(): PageHeaderNode {
  return new PageHeaderNode();
}

export type SerializedPageHeaderNode = SerializedElementNode & {
  type: 'page-header';
  version: 1;
};

/**
 * PageHeaderNode: Sayfa başlığını (header) temsil eden node.
 * Bu node `PageSectionNode`'dan kalıtım alır ve sadece gereken tip/isim bilgilerini sağlar.
 */
export class PageHeaderNode extends PageSectionNode {
  protected sectionClassName(): string {
    return 'a4-header';
  }

  static getType(): string {
    return 'page-header';
  }

  /**
   * Lexical requirement: concrete node classes must implement a static clone method.
   * Burada key bilgisini koruyarak yeni bir instance döneriz.
   */
  static clone(node: PageHeaderNode): PageHeaderNode {
    // ElementNode constructor in this codebase expects the key string optionally.
    return new PageHeaderNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedPageHeaderNode): PageHeaderNode {
    return new PageHeaderNode();
  }

  exportJSON(): SerializedPageHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'page-header',
      version: 1
    };
  }
}
