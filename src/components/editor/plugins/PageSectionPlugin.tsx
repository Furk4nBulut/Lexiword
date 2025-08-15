import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import type { PageNode } from '../nodes/PageNode';
import { PageHeaderNode } from '../nodes/PageHeaderNode';
import { PageFooterNode } from '../nodes/PageFooterNode';
import { usePageNumberToggle } from './PageNumberTogglePlugin';

interface ToolbarPluginProps {
  headerFooterEditMode: boolean;
  setHeaderFooterEditMode: (v: boolean) => void;
}

export function PageSectionPlugin({
  headerFooterEditMode,
  setHeaderFooterEditMode
}: ToolbarPluginProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const handlePageNumber = usePageNumberToggle();

  // Header ekle/kaldır
  const handleHeader = (): void => {
    editor.update(() => {
      const root = $getRoot();
      const pageNodes = root
        .getChildren()
        .filter(
          (n) => typeof (n as any).getType === 'function' && (n as any).getType() === 'page'
        ) as PageNode[];
      pageNodes.forEach((pageNode) => {
        const header = pageNode.getHeaderNode();
        if (header != null) {
          header.remove();
        } else if (typeof pageNode.ensureHeaderFooterContentChildren === 'function') {
          // Sadece header eksikse ekle
          const content = pageNode.getChildren().find((c) => c.getType() === 'page-content');
          const footer = pageNode.getFooterNode();
          // Tüm çocukları kaldır
          pageNode.getChildren().forEach((child) => {
            child.remove();
          });
          pageNode.append(new PageHeaderNode());
          if (content != null) pageNode.append(content);
          if (footer != null) pageNode.append(footer);
        }
      });
    });
  };

  // Footer ekle/kaldır
  const handleFooter = (): void => {
    editor.update(() => {
      const root = $getRoot();
      const pageNodes = root
        .getChildren()
        .filter(
          (n) => typeof (n as any).getType === 'function' && (n as any).getType() === 'page'
        ) as PageNode[];
      pageNodes.forEach((pageNode) => {
        const footer = pageNode.getFooterNode();
        if (footer != null) {
          footer.remove();
        } else if (typeof pageNode.ensureHeaderFooterContentChildren === 'function') {
          // Sadece footer eksikse ekle
          const header = pageNode.getHeaderNode();
          const content = pageNode.getChildren().find((c) => c.getType() === 'page-content');
          // Tüm çocukları kaldır
          pageNode.getChildren().forEach((child) => {
            child.remove();
          });
          if (header != null) pageNode.append(header);
          if (content != null) pageNode.append(content);
          pageNode.append(new PageFooterNode());
        }
      });
    });
  };

  return (
    <div className="toolbarGroup">
      <button
        type="button"
        className="toolbarButton"
        onClick={() => {
          setHeaderFooterEditMode(!headerFooterEditMode);
        }}
        title="Header/Footer Düzenle"
      >
        {headerFooterEditMode ? 'Düzenleme Modunu Kapat' : 'Header/Footer Düzenle'}
      </button>
      {headerFooterEditMode && (
        <>
          <button className="toolbarButton" onClick={handleHeader} title="Header Ekle/Kaldır">
            Header Ekle/Kaldır
          </button>
          <button className="toolbarButton" onClick={handleFooter} title="Footer Ekle/Kaldır">
            Footer Ekle/Kaldır
          </button>
          <button className="toolbarButton" onClick={handlePageNumber} title="Sayfa Numarası Ekle">
            Sayfa Numarası Ekle
          </button>
        </>
      )}
    </div>
  );
}
