import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ToolbarPlugin } from '../toolbar/Toolbar';
import './styles.css';
import { editorNodes } from './nodes';
import { PageInitializerPlugin } from './plugins/PageInitializerPlugin';
import { EditModeProvider } from './EditModeContext';
import { ContentSelectAllPlugin } from './plugins/ContentSelectAllPlugin';
import { PageAutoSplitPlugin } from './plugins/PageAutoSplitPlugin';
import PageContentFlowPlugin from './plugins/PageContentFlowPlugin';
import PageContentEditable from './PageContentEditable';
import { HeaderFooterSyncPlugin } from './plugins/HeaderFooterSyncPlugin';

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

export default function Editor(): JSX.Element {
  const [headerFooterEditMode, setHeaderFooterEditMode] = React.useState(false);
  const initialConfig = {
    namespace: 'SimpleEditor',
    theme,
    onError,
    editorState: initialEditorState,
    nodes: editorNodes
  } as const;

  // EditModeContext'i hem değer hem setter ile sağlayalım
  const editModeContextValue = React.useMemo(
    () => ({ headerFooterEditMode, setHeaderFooterEditMode }),
    [headerFooterEditMode]
  );

  return (
    <div className="editor-a4-wrapper">
      <LexicalComposer initialConfig={initialConfig}>
        <EditModeProvider value={editModeContextValue}>
          <ToolbarPlugin
            headerFooterEditMode={headerFooterEditMode}
            setHeaderFooterEditMode={setHeaderFooterEditMode}
          />
          <RichTextPlugin
            contentEditable={<PageContentEditable />}
            placeholder={<div className="editor-placeholder">Start typing...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <PageInitializerPlugin />
          <HistoryPlugin />
          <ContentSelectAllPlugin />
          <PageAutoSplitPlugin pageHeightMm={297} marginTopMm={20} marginBottomMm={20} />
          <PageContentFlowPlugin />
          {/* Header/Footer senkronizasyonu için plugin ekleniyor */}
          <HeaderFooterSyncPlugin />
        </EditModeProvider>
      </LexicalComposer>
    </div>
  );
}
