import { ElementNode, SerializedElementNode, EditorConfig, LexicalNode, Spread } from 'lexical';
import * as React from 'react';

export type SerializedPageFooterNode = Spread<
  {
    type: 'page-footer';
    version: 1;
    text: string;
    visible: boolean;
  },
  SerializedElementNode
>;

export class PageFooterNode extends ElementNode {
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

  setVisible(visible: boolean) {
    const writable = this.getWritable();
    writable.__visible = visible;
  }
  isVisible() {
    return this.__visible;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    dom.contentEditable = 'true';
    dom.innerText = this.__text;
    dom.style.display = this.__visible ? '' : 'none';
    dom.addEventListener('input', (e) => {
      this.__text = (e.target as HTMLElement).innerText;
    });
    return dom;
  }

  updateDOM(prevNode: PageFooterNode, dom: HTMLElement): boolean {
    if (prevNode.__text !== this.__text) {
      dom.innerText = this.__text;
    }
    dom.style.display = this.__visible ? '' : 'none';
    return false;
  }

  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    const node = new PageFooterNode(serializedNode.text, undefined, serializedNode.visible);
    return node;
  }

  exportJSON(): SerializedPageFooterNode {
    return {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1,
      text: this.__text,
      visible: this.__visible,
    };
  }

  decorate(): JSX.Element | null {
    if (!this.__visible) return null;
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
