import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';

export function WordCountPlugin({
  onWordCountChange
}: {
  onWordCountChange?: (words: number, chars: number) => void;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const text = $getRoot().getTextContent();
        const words = text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        const chars = text.length;
        onWordCountChange?.(words, chars);
      });
    });
  }, [editor, onWordCountChange]);

  return null;
}
