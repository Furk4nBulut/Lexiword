import { ElementNode, type SerializedElementNode, type EditorConfig, type Spread } from 'lexical';
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

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  setVisible(visible: boolean) {
    const writable = this.getWritable();
    writable.__visible = visible;
  }
  isVisible() {
    return this.__visible;
  }

  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    // Edit mode kontrolü
    const editMode = typeof window !== 'undefined' ? ((window as any).__headerFooterEditMode || (window as any).__footerEditMode) : false;
    dom.contentEditable = editMode ? 'true' : 'false';
    dom.innerText = this.__text;
    dom.style.display = this.__visible ? '' : 'none';
    dom.style.outline = editMode ? '2px solid #1976d2' : 'none';
    if (editMode) {
      dom.addEventListener('input', (e) => {
        this.__text = (e.target as HTMLElement).innerText;
      });
    }
    return dom;
  }

  updateDOM(prevNode: PageFooterNode, dom: HTMLElement): boolean {
    // Edit mode kontrolü
    const editMode = typeof window !== 'undefined' ? ((window as any).__headerFooterEditMode || (window as any).__footerEditMode) : false;
    dom.contentEditable = editMode ? 'true' : 'false';
    dom.style.outline = editMode ? '2px solid #1976d2' : 'none';
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
    const editMode = typeof window !== 'undefined' ? ((window as any).__headerFooterEditMode || (window as any).__footerEditMode) : false;
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
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (divRef.current && divRef.current.innerText !== text) {
      divRef.current.innerText = text;
    }
  }, [text]);

  React.useEffect(() => {
    if (divRef.current) {
      divRef.current.contentEditable = (!readOnly).toString();
    }
  }, [readOnly]);

  const handleInput = React.useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newText = (e.target as HTMLDivElement).innerText;
    if (typeof window !== 'undefined' && window.editor) {
      window.editor.update(() => {
        const node = window.editor.getEditorState().read(() => window.editor.getElementByKey(nodeKey));
        if (node && typeof node.setText === 'function') {
          node.setText(newText);
        }
      });
    }
  }, [nodeKey]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      const el = divRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, []);

  return (
    <div
      ref={divRef}
      className="a4-footer"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-node-key={nodeKey}
      style={{ minHeight: '32px', outline: readOnly ? 'none' : '2px solid #1976d2' }}
    />
  );
}
