// PageHeaderNode ve PageFooterNode artık ElementNode'dur (önceden DecoratorNode idi)
import { PageNode } from './PageNode';
import { PageHeaderNode } from './PageHeaderNode';
import { PageContentNode } from './PageContentNode';
import { PageFooterNode } from './PageFooterNode';
import { ParagraphNode, TextNode, LineBreakNode } from 'lexical';
import PageNumberNode from './PageNumberNode';

// Lexical'ın kendi node'ları (özellikle ParagraphNode ve TextNode) mutlaka eklenmeli!
export const editorNodes = [
  PageNode,
  PageHeaderNode,
  PageContentNode,
  PageFooterNode,
  PageNumberNode,
  ParagraphNode,
  TextNode,
  LineBreakNode
];
