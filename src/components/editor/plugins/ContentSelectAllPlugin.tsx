import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useEffect} from 'react';
import {KEY_MODIFIER_COMMAND, COMMAND_PRIORITY_CRITICAL} from 'lexical';

export function ContentSelectAllPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregister = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
          const content = document.querySelector('.a4-content');
          if (!content) return false;
          event.preventDefault();
          const range = document.createRange();
          range.selectNodeContents(content);
          const sel = window.getSelection();
          if (!sel) return true;
          sel.removeAllRanges();
          sel.addRange(range);
          return true; // handled
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return unregister;
  }, [editor]);

  return null;
}
