import {
  DecoratorNode,
  type SerializedElementNode,
  type EditorConfig,
  type Spread,
  $getNodeByKey,
  type NodeKey,
  type LexicalEditor
} from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEditModeContext } from '../EditModeContext';

export type SerializedPageFooterNode = Spread<
  { type: 'page-footer'; version: 1; text: string; visible: boolean },
  SerializedElementNode
>;

export class PageFooterNode extends DecoratorNode<JSX.Element> {
  __text: string;

  __visible: boolean;

  static getType(): string {
    return 'page-footer';
  }

  static clone(node: PageFooterNode): PageFooterNode {
    return new PageFooterNode(node.__text, node.__key, node.__visible);
  }

  constructor(text = '', key?: string, visible = false) {
    super(key);
    this.__text = text;
    this.__visible = visible;
  }

  setVisible(visible: boolean): void {
    const writable = this.getWritable();
    writable.__visible = visible;
  }

  isVisible(): boolean {
    return this.__visible;
  }

  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    const node = new PageFooterNode(serializedNode.text, undefined, serializedNode.visible);
    return node;
  }

  exportJSON(): SerializedPageFooterNode {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const json = {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1,
      text: this.__text,
      visible: this.__visible
    } as SerializedPageFooterNode;
    return json;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return this.__visible ? <FooterEditable text={this.__text} nodeKey={this.getKey()} /> : <></>;
  }
}

function FooterEditable({ text, nodeKey }: { text: string; nodeKey: NodeKey }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { headerFooterEditMode } = useEditModeContext();
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = divRef.current;
    if (el !== null && el.innerText !== text) {
      el.innerText = text;
    }
  }, [text]);

  const commit = React.useCallback(
    (newText: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof PageFooterNode) {
          node.setText(newText);
        }
      });
    },
    [editor, nodeKey]
  );

  const handleInput = React.useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const newText = (e.target as HTMLDivElement).innerText;
      commit(newText);
    },
    [commit]
  );

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      const el = divRef.current;
      if (el !== null) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (sel !== null) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, []);

  return (
    <div
      ref={divRef}
      className="a4-footer"
      contentEditable={headerFooterEditMode}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-node-key={nodeKey}
      data-lexical-node-key={nodeKey}
      style={{ minHeight: '32px', outline: headerFooterEditMode ? '2px solid #1976d2' : 'none' }}
    />
  );
}
