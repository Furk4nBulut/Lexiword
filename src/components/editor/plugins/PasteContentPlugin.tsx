/**
 * PasteContentPlugin
 *
 * Yapıştırma olaylarını yakalar ve yalnızca `.a4-content` alanına
 * yapıştırmaya izin verir; HTML içeren dış yapıştırmaları düz metne çevirir.
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getSelection } from 'lexical';

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
      const html = e.clipboardData?.getData('text/html') ?? '';
      const text = e.clipboardData?.getData('text/plain') ?? '';
      // Eğer dışarıdan (HTML içeren) paste ise düz metne çevir
      if (typeof html === 'string' && html.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        editor.update(() => {
          const selection = $getSelection();
          if (
            selection !== null &&
            selection !== undefined &&
            typeof selection.insertText === 'function'
          ) {
            selection.insertText(text);
          }
        });
        console.debug('[PasteContentPlugin] HTML paste converted to plain text.');
        return;
      }
      // Sadece text/plain varsa, Lexical'ın kendi paste işlemi çalışsın (engelleme)
      console.debug('[PasteContentPlugin] Native paste allowed (plain text only).');
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
