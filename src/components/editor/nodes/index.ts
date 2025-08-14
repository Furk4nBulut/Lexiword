
// PageHeaderNode ve PageFooterNode artık ElementNode'dur (önceden DecoratorNode idi)
import { PageNode } from './PageNode';
import { PageHeaderNode } from './PageHeaderNode';
import { PageContentNode } from './PageContentNode';
import { PageFooterNode } from './PageFooterNode';

export const editorNodes = [PageNode, PageHeaderNode, PageContentNode, PageFooterNode];
