import { ElementNode, type SerializedElementNode, type EditorConfig } from 'lexical';
import { CURRENT_HEADER_FOOTER_EDIT_MODE } from '../plugins/HeaderFooterEditModePlugin';

/**
 * Shared base class for page header / footer nodes.
 *
 * This consolidates duplicate logic between `PageHeaderNode` and `PageFooterNode`
 * (DOM creation, edit-mode handling, import/export helpers).
 */
export abstract class PageSectionNode extends ElementNode {
  /**
   * Subclasses must return the CSS class used for the DOM element
   */
  protected abstract sectionClassName(): string;

  /**
   * Prevent removal unless edit-mode is enabled via the controlling plugin.
   */
  remove(): void {
    if (CURRENT_HEADER_FOOTER_EDIT_MODE) {
      super.remove();
    }
  }

  // no custom constructor needed, inherit ElementNode's behavior

  static getType(): string {
    // subclasses override with specific type
    return 'page-section';
  }

  static clone(_node: any): any {
    // create a fresh instance of the concrete subclass
    return new (this as any)();
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = this.sectionClassName();
    dom.setAttribute('data-lexical-node-key', this.getKey());
    dom.setAttribute('data-edit-mode', CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false');
    dom.contentEditable = CURRENT_HEADER_FOOTER_EDIT_MODE ? 'true' : 'false';
    dom.setAttribute('tabIndex', '0');
    dom.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    return dom;
  }

  updateDOM(_prevNode: PageSectionNode, dom: HTMLElement): boolean {
    const editMode = dom.getAttribute('data-edit-mode') === 'true';
    dom.contentEditable = editMode ? 'true' : 'false';
    return false;
  }

  static importJSON(_serializedNode: any): any {
    return new (this as any)();
  }

  exportJSON(): SerializedElementNode & { type: string; version: number } {
    return {
      ...super.exportJSON(),
      type: (this.constructor as any).getType?.() ?? 'page-section',
      version: 1
    };
  }
}
