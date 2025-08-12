import { ElementNode, SerializedElementNode, EditorConfig, LexicalNode, Spread } from 'lexical';
import * as React from 'react';

export type SerializedPageHeaderNode = Spread<
  {
    type: 'page-header';
    version: 1;
    text: string;
    visible: boolean;
  },
  SerializedElementNode
>;

export class PageHeaderNode extends ElementNode {
  __text: string;
  __visible: boolean;

  static getType(): string {
    return 'page-header';
  }

  static clone(node: PageHeaderNode): PageHeaderNode {
    return new PageHeaderNode(node.__text, node.__key, node.__visible);
  }

  constructor(text = '', key?: string, visible = false) {
    super(key);
    this.__text = text;
    this.__visible = visible;
  }

  setVisible(visible: boolean) {
    const writable = this.getWritable();
    writable.__visible = visible;
  }
  isVisible() {
    return this.__visible;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-header';
    dom.contentEditable = 'true';
    dom.innerText = this.__text;
    dom.style.display = this.__visible ? '' : 'none';
    dom.addEventListener('input', (e) => {
      this.__text = (e.target as HTMLElement).innerText;
    });
    return dom;
  }

  updateDOM(prevNode: PageHeaderNode, dom: HTMLElement): boolean {
    if (prevNode.__text !== this.__text) {
      dom.innerText = this.__text;
    }
    dom.style.display = this.__visible ? '' : 'none';
    return false;
  }

  static importJSON(serializedNode: SerializedPageHeaderNode): PageHeaderNode {
    const node = new PageHeaderNode(serializedNode.text, undefined, serializedNode.visible);
    return node;
  }

  exportJSON(): SerializedPageHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'page-header',
      version: 1,
      text: this.__text,
      visible: this.__visible,
    };
  }

  decorate(): JSX.Element | null {
    if (!this.__visible) return null;
    return <HeaderEditable text={this.__text} nodeKey={this.getKey()} />;
  }
}

function HeaderEditable({ text, nodeKey }: { text: string; nodeKey: string }) {
  const [value, setValue] = React.useState(text);
  return (
    <div
      className="a4-header"
      contentEditable
      suppressContentEditableWarning
      onInput={e => setValue((e.target as HTMLElement).innerText)}
      data-node-key={nodeKey}
      style={{ minHeight: '32px' }}
    >
      {value}
    </div>
  );
}
