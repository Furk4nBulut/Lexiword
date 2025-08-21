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
import {
  KEY_MODIFIER_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $getRoot,
  $setSelection,
  $createRangeSelection
} from 'lexical';
import { isContentNode } from '../nodes/sectionTypeGuards';

export function ContentSelectAllPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Sadece .a4-content odaklıyken Ctrl+A ile Lexical selection yap, paste'e karışma
    const unregister = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        const active = document.activeElement;
        if (active == null) return false;
        if (!(active instanceof HTMLElement)) return false;
        if (!active.classList.contains('a4-content')) return false;
        // Sadece .a4-content odaklıyken Ctrl+A çalışsın
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
          event.preventDefault();
          editor.update(() => {
            // Tüm PageContentNode'ları seç
            const rootNode = $getRoot();
            if (rootNode == null) return;
            const contentNodes = rootNode.getChildren().filter(isContentNode);
            if (contentNodes.length === 0) return;
            const first = contentNodes[0];
            const last = contentNodes[contentNodes.length - 1];
            const selection = $createRangeSelection();
            selection.anchor.set(first.getKey(), 0, 'element');
            selection.focus.set(last.getKey(), last.getChildrenSize(), 'element');
            $setSelection(selection);
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return unregister;
  }, [editor]);
  return null;
}
