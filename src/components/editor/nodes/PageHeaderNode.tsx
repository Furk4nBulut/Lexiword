import { CURRENT_HEADER_FOOTER_EDIT_MODE } from '../plugins/HeaderFooterEditModePlugin';
import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';
export function $createPageHeaderNode(): PageHeaderNode {
  return new PageHeaderNode();
}
export type SerializedPageHeaderNode = SerializedElementNode & {
  type: 'page-header';
  version: 1;
};
// PageHeaderNode: Sayfa başlığını (header) temsil eden Lexical ElementNode sınıfı.
// Header'ın içeriği bir paragraf node olarak tutulur.
export class PageHeaderNode extends ElementNode {
  constructor(key?: string) {
    super(key);
    if (typeof window !== 'undefined') {
      // debug log kaldırıldı
    }
  }

  static getType(): string {
    return 'page-header';
  }

  static clone(node: PageHeaderNode): PageHeaderNode {
    // Yeni bir key ile klonla, böylece Lexical node çakışması olmaz
    return new PageHeaderNode();
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-header';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    dom.setAttribute('data-edit-mode', CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false');
    // Sadece edit moda göre ayarla, child'lara bakma
    dom.contentEditable = CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false';
    dom.setAttribute('tabIndex', '0');
    dom.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    return dom;
  }

  updateDOM(prevNode: PageHeaderNode, dom: HTMLElement): boolean {
    // Sadece edit moda göre ayarla, child'lara bakma
    const editMode = dom.getAttribute('data-edit-mode') === 'true';
    dom.contentEditable = editMode ? 'true' : 'false';
    return false;
  }

  static importJSON(serializedNode: SerializedPageHeaderNode): PageHeaderNode {
    return new PageHeaderNode();
  }

  exportJSON(): SerializedPageHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'page-header',
      version: 1
    };
  }
}
