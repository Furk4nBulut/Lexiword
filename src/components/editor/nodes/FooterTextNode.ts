import { TextNode, type EditorConfig } from 'lexical';
import { CURRENT_HEADER_FOOTER_EDIT_MODE } from '../plugins/HeaderFooterEditModePlugin';

export class FooterTextNode extends TextNode {
  static getType(): string {
    return 'footer-text';
  }

  isEditable(): boolean {
    return CURRENT_HEADER_FOOTER_EDIT_MODE;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.setAttribute('contenteditable', CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false');
    return dom;
  }
}
