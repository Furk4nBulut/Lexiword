
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createPageNumberNode } from '../nodes/PageNumberNode';
import * as Toolbar from '@radix-ui/react-toolbar';

// Header'a sayfa numarası ekle/çıkar fonksiyonu (hook)
export function useHeaderPageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();
  return React.useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const pageNodes = root
        .getChildren()
        .filter((n) => typeof n.getType === 'function' && n.getType() === 'page');
      pageNodes.forEach((pageNode, idx) => {
        const header = pageNode
          .getChildren()
          .find((c) => typeof c.getType === 'function' && c.getType() === 'page-header');
        if (header != null) {
          const children = header.getChildren?.();
          const hasPageNumber =
						Array.isArray(children) &&
						children.some(
						  (c) => typeof c.getType === 'function' && c.getType() === 'page-number'
						);
          if (hasPageNumber) {
            children.forEach((child) => {
              if (typeof child.getType === 'function' && child.getType() === 'page-number') {
                child.remove();
              }
            });
          } else {
            header.append($createPageNumberNode(String(idx + 1)));
          }
        }
      });
    });
  }, [editor]);
}

// Footer'a sayfa numarası ekle/çıkar fonksiyonu (hook)
export function useFooterPageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();
  return React.useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const pageNodes = root
        .getChildren()
        .filter((n) => typeof n.getType === 'function' && n.getType() === 'page');
      pageNodes.forEach((pageNode, idx) => {
        const footer = pageNode
          .getChildren()
          .find((c) => typeof c.getType === 'function' && c.getType() === 'page-footer');
        if (footer != null) {
          const children = footer.getChildren?.();
          const hasPageNumber =
						Array.isArray(children) &&
						children.some(
						  (c) => typeof c.getType === 'function' && c.getType() === 'page-number'
						);
          if (hasPageNumber) {
            children.forEach((child) => {
              if (typeof child.getType === 'function' && child.getType() === 'page-number') {
                child.remove();
              }
            });
          } else {
            footer.append($createPageNumberNode(String(idx + 1)));
          }
        }
      });
    });
  }, [editor]);
}

// HeaderPageNumberButton bileşeni
export function HeaderPageNumberButton(): JSX.Element {
  const toggleHeaderPageNumber = useHeaderPageNumberToggle();
  const [enabled, setEnabled] = React.useState(false);
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const pageNodes = root
          .getChildren()
          .filter((n: any) => typeof n.getType === 'function' && n.getType() === 'page');
        setEnabled(
          pageNodes.some((pageNode: any) => {
            const children = pageNode.getChildren();
            return (
              Array.isArray(children) &&
							children.some(
							  (c: any) => typeof c.getType === 'function' && c.getType() === 'page-header'
							)
            );
          })
        );
      });
    });
  }, [editor]);
  return (
		<Toolbar.Button
			onClick={toggleHeaderPageNumber}
			disabled={!enabled}
			title={"Header'a Sayfa Numarası Ekle/Çıkar"}
			className="toolbarButton"
		>
			Header&apos;a Sayfa No
		</Toolbar.Button>
  );
}

// FooterPageNumberButton bileşeni
export function FooterPageNumberButton(): JSX.Element {
  const toggleFooterPageNumber = useFooterPageNumberToggle();
  const [enabled, setEnabled] = React.useState(false);
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const pageNodes = root
          .getChildren()
          .filter((n: any) => typeof n.getType === 'function' && n.getType() === 'page');
        setEnabled(
          pageNodes.some((pageNode: any) =>
            pageNode
              .getChildren()
              .some((c: any) => typeof c.getType === 'function' && c.getType() === 'page-footer')
          )
        );
      });
    });
  }, [editor]);
  return (
		<Toolbar.Button
			onClick={toggleFooterPageNumber}
			disabled={!enabled}
			title={"Footer'a Sayfa Numarası Ekle/Çıkar"}
			className="toolbarButton"
		>
			Footer&apos;a Sayfa No
		</Toolbar.Button>
  );
}
