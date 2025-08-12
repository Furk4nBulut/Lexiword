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
  showHeader: boolean;
  setShowHeader: (v: boolean) => void;
  showFooter: boolean;
  setShowFooter: (v: boolean) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}

export default function Editor({
  showHeader,
  setShowHeader,
  showFooter,
  setShowFooter,
  editMode,
  setEditMode,
}: EditorProps) {
  const initialConfig = {
    namespace: 'SimpleEditor',
    theme,
    onError,
    editorState: initialEditorState,
    nodes: editorNodes
  } as const;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarPlugin
        editMode={editMode}
        setEditMode={setEditMode}
        showHeader={showHeader}
        setShowHeader={setShowHeader}
        showFooter={showFooter}
        setShowFooter={setShowFooter}
      />
          {/* Header/Footer statik gösterimi kaldırıldı, Lexical node'lar üzerinden render edilecek */}
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
