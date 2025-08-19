// Global variable to track current edit mode for header/footer
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  createCommand,
  $getRoot,
  $isElementNode,
  $setSelection,
  $createRangeSelection
} from 'lexical';
export let CURRENT_HEADER_FOOTER_EDIT_MODE = false;

// Tek bir yerde tanımlanır ve export edilir
export const SET_HEADER_FOOTER_EDIT_MODE_COMMAND = createCommand<boolean>(
  'SET_HEADER_FOOTER_EDIT_MODE_COMMAND'
);

/**
 * HeaderFooterEditModePlugin
 *
 * Edit mode değiştikçe, tüm header/footer DOM'larına data-edit-mode attribute'u ve contentEditable güncellenir.
 */
export function HeaderFooterEditModePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Komut kaydı: edit mode değişince tüm header/footer DOM'larını güncelle
    return editor.registerCommand(
      SET_HEADER_FOOTER_EDIT_MODE_COMMAND,
      (editMode: boolean) => {
        CURRENT_HEADER_FOOTER_EDIT_MODE = editMode;
        document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
          (el as HTMLElement).setAttribute('data-edit-mode', editMode ? 'true' : 'false');
          (el as HTMLElement).contentEditable = editMode ? 'true' : 'false';
        });

        // Edit mode aktif olduğunda, ilk header/footer alanına caret yerleştir
        if (editMode) {
          setTimeout(() => {
            editor.update(() => {
              const root = $getRoot();
              const pageNodes = root
                .getChildren()
                .filter((n) => $isElementNode(n) && typeof n.getChildren === 'function');
              // Öncelik: header, sonra footer
              let found = false;
              for (const page of pageNodes) {
                if (typeof page.getHeaderNode === 'function') {
                  const header = page.getHeaderNode();
                  if ($isElementNode(header)) {
                    const headerChildren = header.getChildren();
                    if (headerChildren.length > 0 && $isElementNode(headerChildren[0])) {
                      // İlk paragraf veya elementin başına caret
                      const firstChild = headerChildren[0];
                      const selection = $createRangeSelection();
                      selection.anchor.set(firstChild.getKey(), 0, 'element');
                      selection.focus.set(firstChild.getKey(), 0, 'element');
                      $setSelection(selection);
                      found = true;
                      break;
                    }
                  }
                }
              }
              if (!found) {
                // Eğer header yoksa, ilk footer'a bak
                for (const page of pageNodes) {
                  if (typeof page.getFooterNode === 'function') {
                    const footer = page.getFooterNode();
                    if ($isElementNode(footer)) {
                      const footerChildren = footer.getChildren();
                      if (footerChildren.length > 0 && $isElementNode(footerChildren[0])) {
                        const firstChild = footerChildren[0];
                        const selection = $createRangeSelection();
                        selection.anchor.set(firstChild.getKey(), 0, 'element');
                        selection.focus.set(firstChild.getKey(), 0, 'element');
                        $setSelection(selection);
                        break;
                      }
                    }
                  }
                }
              }
              // Editor'u focusla (DOM'a focus)
              setTimeout(() => {
                const el = document.querySelector('.a4-header, .a4-footer');
                if (el !== null) {
                  (el as HTMLElement).focus();
                }
              }, 0);
            });
          }, 0);
        }
        return false;
      },
      0
    );
  }, [editor]);

  return null;
}
