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
  UnderlineIcon,
} from '@radix-ui/react-icons';
import { OrderedListIcon, UnorderedListIcon } from './icons';
import './Toolbar.css';
import { PageNode } from '../editor/nodes/PageNode';

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

function SectionToolbarGroup({
  editMode,
  setEditMode,
  showHeader,
  setShowHeader,
  showFooter,
  setShowFooter,
}: ToolbarPluginProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const handleAddSection = () => {
    PageNode.createSection(editor);
  };
  return (
    <div className="toolbarGroup">
      <ToolbarButton
        onClick={() => setEditMode(!editMode)}
        className={editMode ? 'active' : ''}
        title={editMode ? 'Düzenleme Modunu Kapat' : 'Header/Footer Düzenle'}
      >
        {editMode ? 'Düzenleme Modunu Kapat' : 'Header/Footer Düzenle'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => setShowHeader(!showHeader)}
        className={showHeader ? 'active' : ''}
        title={showHeader ? 'Header Kaldır' : 'Header Ekle'}
      >
        {showHeader ? 'Header Kaldır' : 'Header Ekle'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => setShowFooter(!showFooter)}
        className={showFooter ? 'active' : ''}
        title={showFooter ? 'Footer Kaldır' : 'Footer Ekle'}
      >
        {showFooter ? 'Footer Kaldır' : 'Footer Ekle'}
      </ToolbarButton>
      <ToolbarButton
        onClick={handleAddSection}
        title="Section Ekle"
      >
        Section Ekle
      </ToolbarButton>
    </div>
  );
}

interface ToolbarPluginProps {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  showHeader: boolean;
  setShowHeader: (v: boolean) => void;
  showFooter: boolean;
  setShowFooter: (v: boolean) => void;
}

export function ToolbarPlugin({
  editMode,
  setEditMode,
  showHeader,
  setShowHeader,
  showFooter,
  setShowFooter,
}: ToolbarPluginProps): JSX.Element {
  return (
    <Toolbar.Root className="toolbarRoot">
      <TextFormatToolbarPlugin />
      <HeadingToolbarPlugin />
      <ListToolbarPlugin />
      <SectionToolbarGroup
        editMode={editMode}
        setEditMode={setEditMode}
        showHeader={showHeader}
        setShowHeader={setShowHeader}
        showFooter={showFooter}
        setShowFooter={setShowFooter}
      />
    </Toolbar.Root>
  );
}
