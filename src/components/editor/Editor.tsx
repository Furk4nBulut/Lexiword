import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ToolbarPlugin } from '../toolbar/Toolbar';
import './styles.css';
import { editorNodes } from './nodes';
import { PageInitializerPlugin } from './plugins/PageInitializerPlugin';

const theme = {
  text: {
    bold: 'editor-bold',
    italic: 'editor-italic',
    underline: 'editor-underline'
  }
};

function onError(error: Error): void {
  console.error(error);
}

function initialEditorState(): void {
  // Initial state handled by PageInitializerPlugin
}

export default function Editor() {
  const initialConfig = {
    namespace: 'SimpleEditor',
    theme,
    onError,
    editorState: initialEditorState,
    nodes: editorNodes
  } as const;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarPlugin />
      <div className="editor-a4-wrapper">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-a4-content" />}
          placeholder={<div className="editor-placeholder">Start typing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <PageInitializerPlugin />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
}
