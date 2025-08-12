import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PageNode } from './PageNode';
import { PageHeaderNode } from './PageHeaderNode';
import { PageContentNode } from './PageContentNode';
import { PageFooterNode } from './PageFooterNode';

export const editorNodes = [
  PageNode,
  PageHeaderNode,
  PageContentNode,
  PageFooterNode,
];
