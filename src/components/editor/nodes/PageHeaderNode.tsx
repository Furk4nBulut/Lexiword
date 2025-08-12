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
    const editMode = typeof window !== 'undefined' ? (window as any).__headerEditMode : false;
    return (
      <HeaderEditable
        text={this.__text}
        nodeKey={this.getKey()}
        readOnly={!editMode}
      />
    );
  }

  isSelected(): boolean {
    // Lexical'ın selection API'si ile bu node seçili mi kontrolü
    if (typeof window === 'undefined') return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const anchorNode = selection.anchorNode as HTMLElement | null;
    if (!anchorNode) return false;
    // En yakın a4-header class'ı var mı?
    return !!anchorNode.closest('.a4-header');
  }

  // Header'ın asla silinememesi için remove ve removeChild'ı override et
  remove(): void {
    // Sadece düzenleme modunda silinebilir
    if (typeof window !== 'undefined' && ((window as any).__headerFooterEditMode || (window as any).__headerEditMode)) {
      super.remove();
    }
    // Mod kapalıysa hiçbir şey yapma
  }
  removeChild(): void {
    if (typeof window !== 'undefined' && ((window as any).__headerFooterEditMode || (window as any).__headerEditMode)) {
      super.removeChild();
    }
  }
}

function HeaderEditable({ text, nodeKey, readOnly }: { text: string; nodeKey: string, readOnly: boolean }) {
  const [value, setValue] = React.useState(text);
  // Lexical update tetikleyici
  const forceUpdate = React.useReducer(x => x + 1, 0)[1];
  return (
    <div
      className="a4-header"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={e => setValue((e.target as HTMLElement).innerText)}
      onDoubleClick={() => {
        if (typeof window !== 'undefined') {
          (window as any).__headerEditMode = true;
          forceUpdate();
        }
      }}
      onBlur={() => {
        if (typeof window !== 'undefined') {
          (window as any).__headerEditMode = false;
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
