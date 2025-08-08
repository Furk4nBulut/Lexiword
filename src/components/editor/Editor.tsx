import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
// import { PageBreakPlugin } from './plugins/pagebreak/PageBreakPlugin';
import {
  DEFAULT_PAGINATION_SETTINGS,
  type PageBreakSettings
} from './plugins/pagebreak/PageBreakSettings';
// import { PageBreakNode } from './plugins/pagebreak/PageBreakNode';
import { WordCountPlugin } from './plugins/wordcount/WordCountPlugin';
import { ToolbarPlugin } from '../toolbar/Toolbar';
import './styles.css';
import { BannerNode, BannerPlugin } from './plugins/banner/BannerPlugin';
import { $getRoot } from 'lexical';
import { $createPageNode, PageNode } from '../../nodes/PageNode';
import { usePageObserver } from '../../hooks/usePageObserver';
import { usePageFlow } from '../../hooks/usePageFlow';

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
  const root = $getRoot();
  if (root.getChildrenSize() === 0) {
    const firstPage = $createPageNode();
    root.append(firstPage);
  }
}

function PageObserver(): null {
  usePageObserver();
  return null;
}

function PageFlow({ settings }: { settings: PageBreakSettings }): null {
  usePageFlow({
    pageHeightMm: settings.pageHeight,
    marginTopMm: settings.marginTop,
    marginBottomMm: settings.marginBottom
  });
  return null;
}

export default function Editor({
  onWordCountChange
}: {
  onWordCountChange?: (words: number, chars: number) => void;
}): JSX.Element {
  const paginationSettings: PageBreakSettings = DEFAULT_PAGINATION_SETTINGS;

  const initialConfig = {
    namespace: 'SimpleEditor',
    theme,
    onError,
    editorState: initialEditorState,
    nodes: [PageNode, BannerNode]
  } as const;

  return (
    <div className="editor-container paginated">
      <div
        className="a4-page"
        style={{
          width: `${paginationSettings.pageWidth}mm`,
          minHeight: `${paginationSettings.pageHeight}mm`,
          margin: `${paginationSettings.marginTop}mm ${paginationSettings.marginRight}mm ${paginationSettings.marginBottom}mm ${paginationSettings.marginLeft}mm`
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <BannerPlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable className="contentEditable" />}
            placeholder={<div className="placeholder">Start typing...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <PageObserver />
          <PageFlow settings={paginationSettings} />
          <HistoryPlugin />
          <WordCountPlugin onWordCountChange={onWordCountChange} />
        </LexicalComposer>
      </div>
    </div>
  );
}
