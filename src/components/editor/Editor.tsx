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
import { useState } from 'react';
import { A4PageLimitPlugin } from './plugins/A4PageLimitPlugin';

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

export interface EditorProps {
}

export default function Editor({
}: EditorProps) {
  const [headerFooterEditMode, setHeaderFooterEditMode] = React.useState(false);
  const initialConfig = {
    namespace: 'SimpleEditor',
    theme,
    onError,
    editorState: initialEditorState,
    nodes: editorNodes
  } as const;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarPlugin headerFooterEditMode={headerFooterEditMode} setHeaderFooterEditMode={setHeaderFooterEditMode} />
          <RichTextPlugin
            contentEditable={<ContentEditable/>}
            placeholder={<div className="editor-placeholder">Start typing...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        <PageInitializerPlugin />
        <HistoryPlugin />
        <A4PageLimitPlugin />
    </LexicalComposer>
  );
}
