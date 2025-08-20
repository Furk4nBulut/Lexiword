import { CURRENT_HEADER_FOOTER_EDIT_MODE } from '../plugins/HeaderFooterEditModePlugin';
import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';

// PageFooterNode: Sayfa alt bilgisini (footer) temsil eden Lexical ElementNode sınıfı.
// Footer'ın içeriği bir paragraf node olarak tutulur.
export class PageFooterNode extends ElementNode {
  /**
   * Edit mode harici silinemez.
   */
  remove(): void {
    if (CURRENT_HEADER_FOOTER_EDIT_MODE) {
      super.remove();
    } // edit mode dışında hiçbir şey yapma (silinemez)
  }

  constructor(key?: string) {
    super(key);
    if (typeof window !== 'undefined') {
      // debug log kaldırıldı
    }
    // Artık FooterTextNode eklenmiyor
  }

  static getType(): string {
    return 'page-footer';
  }

  static clone(node: PageFooterNode): PageFooterNode {
    // Yeni bir key ile klonla, böylece Lexical node çakışması olmaz
    return new PageFooterNode();
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'a4-footer';
    dom.setAttribute('data-lexical-node-key', this.getKey());
    dom.setAttribute('data-edit-mode', CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false');
    // Sadece edit moda göre ayarla, child'lara bakma
    dom.contentEditable = CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false';
    dom.setAttribute('tabIndex', '0');
    dom.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    if (typeof window !== 'undefined') {
      // debug log kaldırıldı
    }
    return dom;
  }

  updateDOM(prevNode: PageFooterNode, dom: HTMLElement): boolean {
    // Sadece edit moda göre ayarla, child'lara bakma
    const editMode = dom.getAttribute('data-edit-mode') === 'true';
    dom.contentEditable = editMode ? 'true' : 'false';
    return false;
  }

  static importJSON(serializedNode: SerializedPageFooterNode): PageFooterNode {
    return new PageFooterNode();
  }

  exportJSON(): SerializedPageFooterNode {
    return {
      ...super.exportJSON(),
      type: 'page-footer',
      version: 1
    };
  }
}

export function $createPageFooterNode(): PageFooterNode {
  return new PageFooterNode();
}

export type SerializedPageFooterNode = SerializedElementNode & {
  type: 'page-footer';
  version: 1;
};
