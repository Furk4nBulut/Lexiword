import type { LexicalNode } from 'lexical';
import { PageContentNode } from './PageContentNode';
import { PageHeaderNode } from './PageHeaderNode';
import { PageFooterNode } from './PageFooterNode';

export function isContentNode(node: LexicalNode | null | undefined): node is PageContentNode {
  return node instanceof PageContentNode;
}

export function isHeaderNode(node: LexicalNode | null | undefined): node is PageHeaderNode {
  return node instanceof PageHeaderNode;
}

export function isFooterNode(node: LexicalNode | null | undefined): node is PageFooterNode {
  return node instanceof PageFooterNode;
}

export type { PageContentNode, PageHeaderNode, PageFooterNode };
