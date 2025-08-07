import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { PaginationPlugin } from './plugins/pagination/PaginationPlugin';
import {
  DEFAULT_PAGINATION_SETTINGS,
  type PaginationSettings
} from './plugins/pagination/PaginationSettings';
import { PageBreakNode } from './plugins/pagination/PageBreakNode';
import { WordCountPlugin } from './plugins/WordCountPlugin';
import { ToolbarPlugin } from '../glyf-toolbar/Toolbar';
import './styles.css';
import { BannerNode, BannerPlugin } from './plugins/banner/BannerPlugin';

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

export default function Editor({
  onWordCountChange
}: {
  onWordCountChange?: (words: number, chars: number) => void;
}): JSX.Element {
  const [pageCount, setPageCount] = React.useState(1);
  const paginationSettings: PaginationSettings = DEFAULT_PAGINATION_SETTINGS;

  const handlePageCountChange = React.useCallback((count: number) => {
    setPageCount(count);
  }, []);

  const initialConfig = {
    namespace: 'SimpleEditor',
    theme,
    onError,
    nodes: [PageBreakNode, BannerNode]
  };

  return (
    <div className="editor-container paginated">
      <div className="page-indicator">Page {pageCount}</div>
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
          <HistoryPlugin />
          <PaginationPlugin
            settings={paginationSettings}
            onPageCountChange={handlePageCountChange}
          />
          <WordCountPlugin onWordCountChange={onWordCountChange} />
        </LexicalComposer>
      </div>
    </div>
  );
}
