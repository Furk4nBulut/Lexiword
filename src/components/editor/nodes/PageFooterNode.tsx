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
    const editMode = typeof window !== 'undefined' ? (window as any).__footerEditMode : false;
    return (
      <FooterEditable
        text={this.__text}
        nodeKey={this.getKey()}
        readOnly={!editMode}
      />
    );
  }

  isSelected(): boolean {
    if (typeof window === 'undefined') return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const anchorNode = selection.anchorNode as HTMLElement | null;
    if (!anchorNode) return false;
    return !!anchorNode.closest('.a4-footer');
  }

  // Footer'ın asla silinememesi için remove ve removeChild'ı override et
  remove(): void {
    // Sadece düzenleme modunda silinebilir
    if (typeof window !== 'undefined' && ((window as any).__headerFooterEditMode || (window as any).__footerEditMode)) {
      super.remove();
    }
    // Mod kapalıysa hiçbir şey yapma
  }
  removeChild(): void {
    if (typeof window !== 'undefined' && ((window as any).__headerFooterEditMode || (window as any).__footerEditMode)) {
      super.removeChild();
    }
  }
}

function FooterEditable({ text, nodeKey, readOnly }: { text: string; nodeKey: string; readOnly: boolean }) {
  const [value, setValue] = React.useState(text);
  // Lexical update tetikleyici
  const forceUpdate = React.useReducer(x => x + 1, 0)[1];
  return (
    <div
      className="a4-footer"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={e => setValue((e.target as HTMLElement).innerText)}
      onDoubleClick={() => {
        if (typeof window !== 'undefined') {
          (window as any).__footerEditMode = true;
          forceUpdate();
        }
      }}
      onBlur={() => {
        if (typeof window !== 'undefined') {
          (window as any).__footerEditMode = false;
          forceUpdate();
        }
      }}
      data-node-key={nodeKey}
      style={{ minHeight: '32px', outline: readOnly ? 'none' : '2px solid #1976d2' }}
    >
      {value}
    </div>
  );
}
