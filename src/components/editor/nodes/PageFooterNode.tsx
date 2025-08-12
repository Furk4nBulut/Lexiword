import { ElementNode, SerializedElementNode, EditorConfig, LexicalNode, Spread } from 'lexical';
import * as React from 'react';

export type SerializedPageFooterNode = Spread<
  {
    type: 'page-footer';
    version: 1;
    text: string;
  },
  SerializedElementNode
>;

export class PageFooterNode extends ElementNode {
  __text: string;

  static getType(): string {
    return 'page-footer';
  }

  static clone(node: PageFooterNode): PageFooterNode {
    return new PageFooterNode(node.__text, node.__key);
  }

  constructor(text = '', key?: string) {
    super(key);
    this.__text = text;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    dom.contentEditable = 'true';
    dom.innerText = this.__text;
    dom.addEventListener('input', (e) => {
      this.__text = (e.target as HTMLElement).innerText;
    });
    return dom;
  }

  updateDOM(prevNode: PageFooterNode, dom: HTMLElement): boolean {
    if (prevNode.__text !== this.__text) {
      dom.innerText = this.__text;
    }
    return false;
  }

  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    const node = new PageFooterNode(serializedNode.text);
    return node;
  }

  exportJSON(): SerializedPageFooterNode {
    return {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1,
      text: this.__text,
    };
  }

  decorate(): JSX.Element {
    return <FooterEditable text={this.__text} nodeKey={this.getKey()} />;
  }
}

function FooterEditable({ text, nodeKey }: { text: string; nodeKey: string }) {
  const [value, setValue] = React.useState(text);
  return (
    <div
      className="a4-footer"
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
