/**
 * Komutlar ve hook'lar: page number ekleme/kaldırma işlemleri için ortak mantık.
 *
 * Bu dosya, toolbar veya diğer bileşenler tarafından dispatch edilebilecek
 * Lexical komutlarını ve küçük hook'ları içerir.
 */
import { createCommand } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as React from 'react';

/**
 * Header/ Footer için toggle komutları
 */
export const TOGGLE_HEADER_PAGE_NUMBER_COMMAND = createCommand('TOGGLE_HEADER_PAGE_NUMBER');
export const TOGGLE_FOOTER_PAGE_NUMBER_COMMAND = createCommand('TOGGLE_FOOTER_PAGE_NUMBER');

/**
 * Hook: Header page number toggle dispatch eden fonksiyonu döner.
 * Kullanım: const toggle = useHeaderPageNumberToggle(); toggle();
 */
export function useHeaderPageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();
  return React.useCallback(() => {
    editor.dispatchCommand(TOGGLE_HEADER_PAGE_NUMBER_COMMAND, undefined);
  }, [editor]);
}

/**
 * Hook: Footer page number toggle dispatch eden fonksiyonu döner.
 */
export function useFooterPageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();
  return React.useCallback(() => {
    editor.dispatchCommand(TOGGLE_FOOTER_PAGE_NUMBER_COMMAND, undefined);
  }, [editor]);
}
