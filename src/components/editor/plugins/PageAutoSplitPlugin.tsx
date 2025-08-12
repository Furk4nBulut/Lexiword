import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { PageNode } from '../nodes/PageNode';
import { PageContentNode } from '../nodes/PageContentNode';

export function PageAutoSplitPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter((n) => n.getType() === 'page');
        pages.forEach((pageNode) => {
          if (!(pageNode instanceof PageNode)) return;
          const contentNode = pageNode.getChildren().find((n) => n.getType() === 'page-content');
          if (contentNode == null) return;
          if (!(contentNode instanceof PageContentNode)) return;
          // Find the DOM for this content node
          const dom = document.querySelector(
            `[data-lexical-node-key="${contentNode.getKey()}"] .a4-content, .a4-content[data-node-key="${contentNode.getKey()}"]`
          );
          if (dom == null) return;
          // If content overflows, split
          if (dom.scrollHeight > dom.clientHeight) {
            // Block-level split: Move overflowing blocks to a new page
            editor.update(() => {
              // Get all block children of contentNode
              const blocks = contentNode.getChildren();
              let totalHeight = 0;
              let splitIndex = -1;
              for (let i = 0; i < blocks.length; i++) {
                const blockKey = blocks[i].getKey();
                const blockDom = dom.querySelector(`[data-lexical-node-key="${blockKey}"]`);
                if (blockDom == null) continue;
                totalHeight += (blockDom as HTMLElement).offsetHeight;
                if (totalHeight > dom.clientHeight) {
                  splitIndex = i;
                  break;
                }
              }
              if (splitIndex > -1) {
                // Create new page and move overflowing blocks
                const newPage = new PageNode({});
                newPage.appendInitialChildren();
                const newContent = newPage
                  .getChildren()
                  .find((n) => n.getType() === 'page-content');
                if (newContent != null && newContent instanceof PageContentNode) {
                  // Move blocks to newContent and remove from old contentNode
                  const toMove = blocks.slice(splitIndex);
                  toMove.forEach((block) => {
                    newContent.append(block);
                    block.remove();
                  });
                }
                // Insert newPage after current pageNode
                pageNode.insertAfter(newPage);
              }
            });
          }
        });
      });
    });
    return unregister;
  }, [editor]);

  return null;
}
