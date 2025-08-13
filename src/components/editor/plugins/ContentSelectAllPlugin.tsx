/**
 * ContentSelectAllPlugin
 *
 * Bu plugin, Ctrl+A (veya Mac'te Cmd+A) kısayoluna basıldığında sadece .a4-content alanındaki tüm içeriği seçer.
 * Böylece kullanıcı, sayfa içeriğini kolayca topluca seçebilir.
 *
 * Kullanım Senaryosu:
 * - Standart Ctrl+A davranışını override ederek, sadece içerik alanını seçmek için kullanılır.
 *
 * Notlar:
 * - Lexical editörün registerCommand API'si ile global kısayol dinlenir.
 * - DOM'da .a4-content class'ı ile işaretli alan hedeflenir.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { KEY_MODIFIER_COMMAND, COMMAND_PRIORITY_CRITICAL } from 'lexical';

export function ContentSelectAllPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Ctrl+A veya Cmd+A tuş kombinasyonunu dinle.
    // Eğer .a4-content alanı varsa, tüm içeriği seç.
    const unregister = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
          // .a4-content alanını bul
          const content = document.querySelector('.a4-content');
          if (content === null) return false;
          event.preventDefault();
          // Range ile tüm içeriği seç
          const range = document.createRange();
          range.selectNodeContents(content);
          const sel = window.getSelection();
          if (sel === null) return true;
          sel.removeAllRanges();
          sel.addRange(range);
          return true; // handled
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return unregister;
  }, [editor]);

  return null;
}
