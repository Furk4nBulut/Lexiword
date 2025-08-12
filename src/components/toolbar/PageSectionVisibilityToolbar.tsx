import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { PageHeaderNode } from '../editor/nodes/PageHeaderNode';
import { PageFooterNode } from '../editor/nodes/PageFooterNode';
import { PageNode } from '../editor/nodes/PageNode';
import { PageContentNode } from '../editor/nodes/PageContentNode';
import * as Toolbar from '@radix-ui/react-toolbar';

export function PageSectionVisibilityToolbar() {
  const [editor] = useLexicalComposerContext();
  const [hasHeader, setHasHeader] = React.useState(false);
  const [hasFooter, setHasFooter] = React.useState(false);

  // Header/footer state'ini güncel tutmak için Lexical'ın updateListener'ını kullan
  React.useEffect(() => {
    // Listener'ı sadece bir kez ekle, her editörde bir tane olsun
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const page = root.getFirstChild();
        if (page instanceof PageNode) {
          // getChildren() her zaman güncel state'i döner
          setHasHeader(!!(page.getChildren().find(child => child instanceof PageHeaderNode)));
          setHasFooter(!!(page.getChildren().find(child => child instanceof PageFooterNode)));
        } else {
          setHasHeader(false);
          setHasFooter(false);
        }
      });
    });
    return unregister;
  }, [editor]);

  const ensureContentNode = (page: PageNode) => {
    const hasContent = !!page.getChildren().find(child => child.getType() === 'page-content');
    if (!hasContent) {
      const contentNode = new PageContentNode();
      // Header varsa onun sonrasına, yoksa en başa ekle
      const header = page.getChildren().find(child => child instanceof PageHeaderNode);
      if (header) {
        header.insertAfter(contentNode);
      } else {
        page.append(contentNode);
      }
    }
  };

  const toggleHeader = () => {
    editor.update(() => {
      const root = $getRoot();
      const page = root.getFirstChild();
      if (page instanceof PageNode) {
        const header = page.getChildren().find(child => child instanceof PageHeaderNode);
        if (header) {
          header.remove();
        } else {
          const newHeader = new PageHeaderNode();
          page.insertBefore(newHeader, page.getFirstChild());
          ensureContentNode(page);
        }
      }
    });
  };

  const toggleFooter = () => {
    editor.update(() => {
      const root = $getRoot();
      const page = root.getFirstChild();
      if (page instanceof PageNode) {
        const footer = page.getChildren().find(child => child instanceof PageFooterNode);
        if (footer) {
          footer.remove();
        } else {
          const newFooter = new PageFooterNode();
          ensureContentNode(page);
          // Footer'ı en sona ekle
          const children = page.getChildren();
          const last = children[children.length - 1];
          if (last && last.getType() === 'page-content') {
            last.insertAfter(newFooter);
          } else {
            page.append(newFooter);
          }
        }
      }
    });
  };

  return (
    <div className="toolbarGroup">
      <Toolbar.Button
        className={hasHeader ? 'toolbarButton active' : 'toolbarButton'}
        onClick={toggleHeader}
        title={hasHeader ? 'Remove Header' : 'Add Header'}
      >
        {hasHeader ? 'Remove Header' : 'Add Header'}
      </Toolbar.Button>
      <Toolbar.Button
        className={hasFooter ? 'toolbarButton active' : 'toolbarButton'}
        onClick={toggleFooter}
        title={hasFooter ? 'Remove Footer' : 'Add Footer'}
      >
        {hasFooter ? 'Remove Footer' : 'Add Footer'}
      </Toolbar.Button>
    </div>
  );
}
