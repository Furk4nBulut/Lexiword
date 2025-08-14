// Global variable to track current edit mode for header/footer
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { createCommand } from 'lexical';
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
        return false;
      },
      0
    );
  }, [editor]);

  return null;
}
