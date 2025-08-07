import * as React from 'react';
import './styles.css';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $setBlocksType_experimental } from '@lexical/selection';
import { $isRangeSelection, $getSelection, type TextFormatType } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_BANNER_COMMAND } from '../glyf-editor/plugins/banner/BannerPlugin';
import * as Toolbar from '@radix-ui/react-toolbar';
import {
  StrikethroughIcon,
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  PlusCircledIcon
} from '@radix-ui/react-icons';
import { OrderedListIcon, UnorderedListIcon } from './icons';
import { BannerColorPickerPlugin } from '../glyf-editor/plugins/banner/BannerColorPickerPlugin';

interface ToolbarButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  children: React.ReactNode;
  title?: string;
  dataAttribute?: string;
  className?: string;
}

function ToolbarButton(props: ToolbarButtonProps): JSX.Element {
  const className = `toolbarButton ${props.className ?? ''}`;
  const additionalProps = props.dataAttribute != null ? { [props.dataAttribute]: true } : {};

  return (
    <Toolbar.Button
      className={className}
      onClick={props.onClick}
      title={props.title}
      {...additionalProps}
    >
      {props.children}
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
          dataAttribute="data-format"
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
          dataAttribute="data-heading"
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
        dataAttribute="data-list"
      >
        <OrderedListIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          onClick('ul');
        }}
        title="Madde işaretli liste"
        dataAttribute="data-list"
      >
        <UnorderedListIcon />
      </ToolbarButton>
    </div>
  );
}

function BannerToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const onClick = (): void => {
    editor.dispatchCommand(INSERT_BANNER_COMMAND, undefined);
  };

  return (
    <div className="toolbarGroup">
      <ToolbarButton onClick={onClick} title="Banner ekle" dataAttribute="data-banner">
        <PlusCircledIcon />
        Banner
      </ToolbarButton>
      <BannerColorPickerPlugin />
    </div>
  );
}

export function ToolbarPlugin(): JSX.Element {
  return (
    <Toolbar.Root className="toolbarRoot">
      <TextFormatToolbarPlugin />
      <HeadingToolbarPlugin />
      <ListToolbarPlugin />
      <BannerToolbarPlugin />
    </Toolbar.Root>
  );
}
