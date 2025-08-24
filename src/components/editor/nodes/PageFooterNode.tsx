import { PageSectionNode } from './PageSectionNode';
import { type SerializedElementNode } from 'lexical';

/**
 * PageFooterNode: Sayfa alt bilgisini (footer) temsil eden node.
 */
export class PageFooterNode extends PageSectionNode {
  protected sectionClassName(): string {
    return 'a4-footer';
  }

  static getType(): string {
    return 'page-footer';
  }

  static importJSON(_serializedNode: SerializedElementNode): PageFooterNode {
    return new PageFooterNode();
  }

  exportJSON(): SerializedElementNode & { type: string; version: number } {
    return {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1
    };
  }
}

export function $createPageFooterNode(): PageFooterNode {
  return new PageFooterNode();
}

export type SerializedPageFooterNode = SerializedElementNode & {
  type: 'page-footer';
  version: 1;
};
