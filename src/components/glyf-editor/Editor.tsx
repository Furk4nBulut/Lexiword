import * as React from 'react';
import './styles.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { ToolbarPlugin } from '../glyf-toolbar/Toolbar';
import { BannerPlugin, BannerNode } from './plugins/banner/BannerPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

const theme = {
  heading: {
    h1: 'glyf-editor-h1',
    h2: 'glyf-editor-h2',
    h3: 'glyf-editor-h3'
  },
  text: {
    bold: 'glyf-editor-bold',
    italic: 'glyf-editor-italic',
    underline: 'glyf-editor-underline',
    strikethrough: 'glyf-editor-strikethrough',
    underlineStrikethrough: 'glyf-editor-underlineStrikethrough'
  },
  banner: 'glyf-editor-banner'
};

function onError(error: Error): void {
  console.error(error);
}

// Kelime ve karakter sayacı bileşeni
function WordCountPlugin({
  onWordCountChange
}: {
  onWordCountChange: (wordCount: number, charCount: number) => void;
}): null {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length;
        const charCount = textContent.length;
        onWordCountChange(wordCount, charCount);
      });
    });
  }, [editor, onWordCountChange]);

  return null;
}

interface EditorProps {
  onWordCountChange?: (wordCount: number, charCount: number) => void;
}

export default function Editor({ onWordCountChange }: EditorProps): JSX.Element {
  const handleWordCountChange = React.useCallback(
    (words: number, chars: number) => {
      onWordCountChange?.(words, chars);
    },
    [onWordCountChange]
  );

  const initialConfig = {
    namespace: 'GlyfEditor',
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, BannerNode]
  };

  return (
    <div className="editor-container">
      <div className="a4-page">
        <LexicalComposer initialConfig={initialConfig}>
          <div className="toolbar-wrapper">
            <ToolbarPlugin />
          </div>

          <div className="a4-content">
            <RichTextPlugin
              contentEditable={<ContentEditable className="contentEditable" />}
              placeholder={<div className="placeholder">Yazmaya başlayın...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <BannerPlugin />
            <ListPlugin />
            <HistoryPlugin />
            <WordCountPlugin onWordCountChange={handleWordCountChange} />
          </div>
        </LexicalComposer>
      </div>
    </div>
  );
}
