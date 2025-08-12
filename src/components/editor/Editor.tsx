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
      <div className="editor-a4-wrapper">
        <div className="a4-page" style={{ display: 'flex', flexDirection: 'column', width: '210mm', height: '297mm', background: '#fff', boxShadow: '0 0 8px #ccc', position: 'relative' }}>
          {showHeader && (
            <div className="a4-header editable">
              Header (Düzenlenebilir)
              <button style={{ float: 'right' }} onClick={() => setShowHeader(false)}>Kaldır</button>
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <RichTextPlugin
              contentEditable={<ContentEditable className="a4-content" style={{ overflow: 'auto', height: '100%' }} />}
              placeholder={<div className="editor-placeholder">Start typing...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          {showFooter && (
            <div className="a4-footer editable">
              Footer (Düzenlenebilir)
              <button style={{ float: 'right' }} onClick={() => setShowFooter(false)}>Kaldır</button>
            </div>
          )}
        </div>
        <PageInitializerPlugin />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
}
