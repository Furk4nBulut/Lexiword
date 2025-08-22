import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

/**
 * PasteContentPlugin
 *
 * Sadece .a4-content alanı içinde yapıştırmaya izin verir.
 * Dışarıya yapıştırma engellenir.
 */
export function PasteContentPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const contentParent = target?.closest?.('.a4-content');
      if (contentParent === null) {
        console.debug('[PasteContentPlugin] Paste blocked (not .a4-content)', target?.className);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      console.debug('[PasteContentPlugin] Paste allowed in .a4-content');
    };

    const rootElem = editor.getRootElement?.();
    if (rootElem !== null && rootElem !== undefined) {
      rootElem.addEventListener('paste', handlePaste, true);
    }

    return () => {
      if (rootElem !== null && rootElem !== undefined) {
        rootElem.removeEventListener('paste', handlePaste, true);
      }
    };
  }, [editor]);

  return null;
}
