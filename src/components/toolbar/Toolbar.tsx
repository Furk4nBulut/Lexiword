import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $setBlocksType_experimental } from '@lexical/selection';
import { $isRangeSelection, $getSelection, type TextFormatType } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import * as Toolbar from '@radix-ui/react-toolbar';
import {
  StrikethroughIcon,
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon
} from '@radix-ui/react-icons';
import { OrderedListIcon, UnorderedListIcon } from './icons';
import './Toolbar.css';

import { SET_HEADER_FOOTER_EDIT_MODE_COMMAND } from '../editor/plugins/HeaderFooterEditModePlugin';
import { PageSectionPlugin } from '../editor/plugins/PageSectionPlugin';
import { $getRoot } from 'lexical';
import { $createPageNumberNode } from '../editor/nodes/PageNumberNode';

// HeaderPageNumberButton bileşeni
function HeaderPageNumberButton(): JSX.Element {
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
    <ToolbarButton
      onClick={toggleHeaderPageNumber}
      disabled={!enabled}
      title={"Header'a Sayfa Numarası Ekle/Çıkar"}
    >
      Header&apos;a Sayfa No
    </ToolbarButton>
  );
}

// FooterPageNumberButton bileşeni
function FooterPageNumberButton(): JSX.Element {
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
    <ToolbarButton
      onClick={toggleFooterPageNumber}
      disabled={!enabled}
      title={"Footer'a Sayfa Numarası Ekle/Çıkar"}
    >
      Footer&apos;a Sayfa No
    </ToolbarButton>
  );
}

// Header'a sayfa numarası ekle/çıkar fonksiyonu
function useHeaderPageNumberToggle(): () => void {
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
          .find((c: any) => typeof c.getType === 'function' && c.getType() === 'page-header');
        if (header != null) {
          // Toggle: Eğer header'da page-number varsa sil, yoksa ekle
          const children = header.getChildren?.();
          const hasPageNumber =
            Array.isArray(children) &&
            children.some(
              (c: any) => typeof c.getType === 'function' && c.getType() === 'page-number'
            );
          if (hasPageNumber) {
            children.forEach((child: any) => {
              if (typeof child.getType === 'function' && child.getType() === 'page-number') {
                if (typeof child.setTextContent === 'function') {
                  child.setTextContent('');
                } else {
                  child.remove();
                }
              }
            });
          } else {
            // Header'ın sonuna doğrudan PageNumberNode (span) ekle
            header.append($createPageNumberNode(String(idx + 1)));
          }
        }
      });
    });
  }, [editor]);
}

// Footer'a sayfa numarası ekle/çıkar fonksiyonu
function useFooterPageNumberToggle(): () => void {
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
          .find((c: any) => typeof c.getType === 'function' && c.getType() === 'page-footer');
        if (footer != null) {
          // Toggle: Eğer footer'da page-number varsa sil, yoksa ekle
          const children = footer.getChildren?.();
          const hasPageNumber =
            Array.isArray(children) &&
            children.some(
              (c: any) => typeof c.getType === 'function' && c.getType() === 'page-number'
            );
          if (hasPageNumber) {
            children.forEach((child: any) => {
              if (typeof child.getType === 'function' && child.getType() === 'page-number') {
                if (typeof child.setTextContent === 'function') {
                  child.setTextContent('');
                } else {
                  child.remove();
                }
              }
            });
          } else {
            // Footer'ın sonuna doğrudan PageNumberNode (span) ekle
            footer.append($createPageNumberNode(String(idx + 1)));
          }
        }
      });
    });
  }, [editor]);
}

interface ToolbarPluginProps {
  headerFooterEditMode: boolean;
  setHeaderFooterEditMode: (v: boolean) => void;
}

interface ToolbarButtonProps {
  className?: string;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton(props: ToolbarButtonProps): JSX.Element {
  const { className, onClick, title, children, disabled, ...rest } = props;
  return (
    <Toolbar.Button
      className={`toolbarButton ${className ?? ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      {...rest}
    >
      {children}
    </Toolbar.Button>
  );
}

function TextFormatToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const getIcon = (format: TextFormatType): JSX.Element | null => {
    switch (format) {
      case 'bold':
        return <FontBoldIcon />;
      case 'italic':
        return <FontItalicIcon />;
      case 'strikethrough':
        return <StrikethroughIcon />;
      case 'underline':
        return <UnderlineIcon />;
      default:
        return null;
    }
  };

  const getTitle = (format: TextFormatType): string => {
    switch (format) {
      case 'bold':
        return 'Kalın (Ctrl+B)';
      case 'italic':
        return 'İtalik (Ctrl+I)';
      case 'underline':
        return 'Alt çizgi (Ctrl+U)';
      case 'strikethrough':
        return 'Üstü çizili';
      default:
        return '';
    }
  };

  const onClick = (format: TextFormatType): void => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText(format);
      }
    });
  };

  const supportedTextFormats: TextFormatType[] = ['bold', 'italic', 'underline', 'strikethrough'];
  return (
    <div className="toolbarGroup">
      {supportedTextFormats.map((format) => (
        <ToolbarButton
          key={format}
          onClick={() => {
            onClick(format);
          }}
          title={getTitle(format)}
          data-format
        >
          {getIcon(format)}
        </ToolbarButton>
      ))}
    </div>
  );
}

type HeadingTag = 'h1' | 'h2' | 'h3';
function HeadingToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const headingTags: HeadingTag[] = ['h1', 'h2', 'h3'];

  const getTitle = (tag: HeadingTag): string => {
    switch (tag) {
      case 'h1':
        return 'Başlık 1';
      case 'h2':
        return 'Başlık 2';
      case 'h3':
        return 'Başlık 3';
      default:
        return '';
    }
  };

  const onClick = (tag: HeadingTag): void => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType_experimental(selection, () => $createHeadingNode(tag) as any);
      }
    });
  };

  return (
    <div className="toolbarGroup">
      {headingTags.map((tag) => (
        <ToolbarButton
          onClick={() => {
            onClick(tag);
          }}
          key={tag}
          title={getTitle(tag)}
          data-heading
        >
          {tag.toUpperCase()}
        </ToolbarButton>
      ))}
    </div>
  );
}

function ListToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const onClick = (tag: 'ol' | 'ul'): void => {
    if (tag === 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    }
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  return (
    <div className="toolbarGroup">
      <ToolbarButton
        onClick={() => {
          onClick('ol');
        }}
        title="Numaralı liste"
        data-list
      >
        <OrderedListIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          onClick('ul');
        }}
        title="Madde işaretli liste"
        data-list
      >
        <UnorderedListIcon />
      </ToolbarButton>
    </div>
  );
}

export function ToolbarPlugin({
  headerFooterEditMode,
  setHeaderFooterEditMode
}: ToolbarPluginProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    editor.dispatchCommand(SET_HEADER_FOOTER_EDIT_MODE_COMMAND, headerFooterEditMode);
  }, [headerFooterEditMode, editor]);
  return (
    <Toolbar.Root className="toolbarRoot">
      <TextFormatToolbarPlugin />
      <HeadingToolbarPlugin />
      <ListToolbarPlugin />
      <HeaderPageNumberButton />
      <FooterPageNumberButton />
      <PageSectionPlugin
        headerFooterEditMode={headerFooterEditMode}
        setHeaderFooterEditMode={setHeaderFooterEditMode}
      />
    </Toolbar.Root>
  );
}
