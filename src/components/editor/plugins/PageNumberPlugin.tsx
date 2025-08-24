import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { addOrReplacePageNumbers } from '../utils/pageNumberUtils';
import { getHeaderPageNumberActive, getFooterPageNumberActive } from './PageAutoSplitPlugin';

import {
  TOGGLE_HEADER_PAGE_NUMBER_COMMAND,
  TOGGLE_FOOTER_PAGE_NUMBER_COMMAND
} from './pageNumber/commands';
export { HeaderPageNumberButton, FooterPageNumberButton } from './pageNumber/ui';

/**
 * PageNumberPlugin
 *
 * Bu dosya, sayfa numarası ile ilgili UI bileşenlerini ve
 * toggle komutlarını bir araya getirir. Komutların kendisi
 * `./pageNumber/commands.ts` içinde tanımlanmıştır.
 */

/**
 * PageNumberCommandPlugin
 *
 * Editör üzerinde dispatch edilen TOGGLE_* komutlarını dinler ve
 * `addOrReplacePageNumbers` ile sayfa numarası ekleme/çıkarma işini yapar.
 */
export function PageNumberCommandPlugin(): null {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    const unregisterHeader = editor.registerCommand(
      TOGGLE_HEADER_PAGE_NUMBER_COMMAND,
      () => {
        const isActive = getHeaderPageNumberActive();
        editor.update(() => {
          addOrReplacePageNumbers({ header: isActive, footer: getFooterPageNumberActive() });
        });
        return true;
      },
      0
    );
    const unregisterFooter = editor.registerCommand(
      TOGGLE_FOOTER_PAGE_NUMBER_COMMAND,
      () => {
        const isActive = getFooterPageNumberActive();
        editor.update(() => {
          addOrReplacePageNumbers({ header: getHeaderPageNumberActive(), footer: isActive });
        });
        return true;
      },
      0
    );
    return () => {
      unregisterHeader();
      unregisterFooter();
    };
  }, [editor]);
  return null;
}
