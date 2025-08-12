import { ElementNode, SerializedElementNode, EditorConfig, LexicalNode, Spread } from 'lexical';
import * as React from 'react';

export type SerializedPageHeaderNode = Spread<
  {
    type: 'page-header';
    version: 1;
    text: string;
  },
  SerializedElementNode
>;

export class PageHeaderNode extends ElementNode {
  __text: string;

  static getType(): string {
    return 'page-header';
  }

  static clone(node: PageHeaderNode): PageHeaderNode {
    return new PageHeaderNode(node.__text, node.__key);
  }

  constructor(text = '', key?: string) {
    super(key);
    this.__text = text;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-header';
    dom.contentEditable = 'true';
    dom.innerText = this.__text;
    dom.addEventListener('input', (e) => {
      this.__text = (e.target as HTMLElement).innerText;
    });
    return dom;
  }

  updateDOM(prevNode: PageHeaderNode, dom: HTMLElement): boolean {
    if (prevNode.__text !== this.__text) {
      dom.innerText = this.__text;
    }
    return false;
  }

  static importJSON(serializedNode: SerializedPageHeaderNode): PageHeaderNode {
    const node = new PageHeaderNode(serializedNode.text);
    return node;
  }

  exportJSON(): SerializedPageHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'page-header',
      version: 1,
      text: this.__text,
    };
  }

  decorate(): JSX.Element {
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
