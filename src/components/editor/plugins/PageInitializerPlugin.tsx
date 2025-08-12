import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { PageNode } from '../nodes/PageNode';

export function PageInitializerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      if (root.getChildrenSize() === 0) {
        const page = new PageNode();
        // Do not add header or footer by default
        root.append(page);
      }
    });
  }, [editor]);

  return null;
}
