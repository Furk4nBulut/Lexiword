import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, createCommand } from 'lexical';
import { addOrReplacePageNumbers } from '../utils/pageNumberUtils';
import {
  setHeaderPageNumberActive,
  setFooterPageNumberActive,
  getHeaderPageNumberActive,
  getFooterPageNumberActive
} from './PageAutoSplitPlugin';
import * as Toolbar from '@radix-ui/react-toolbar';

// Lexical command tanımları
export const TOGGLE_HEADER_PAGE_NUMBER_COMMAND = createCommand('TOGGLE_HEADER_PAGE_NUMBER');
export const TOGGLE_FOOTER_PAGE_NUMBER_COMMAND = createCommand('TOGGLE_FOOTER_PAGE_NUMBER');

// Header'a sayfa numarası ekle/çıkar fonksiyonu (hook)
export function useHeaderPageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();
  // Komut dispatch eden fonksiyon
  return React.useCallback(() => {
    editor.dispatchCommand(TOGGLE_HEADER_PAGE_NUMBER_COMMAND, undefined);
  }, [editor]);
}

// Footer'a sayfa numarası ekle/çıkar fonksiyonu (hook)
export function useFooterPageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();
  // Komut dispatch eden fonksiyon
  return React.useCallback(() => {
    editor.dispatchCommand(TOGGLE_FOOTER_PAGE_NUMBER_COMMAND, undefined);
  }, [editor]);
}

// Plugin: Komutları dinler ve page number ekler/çıkarır
export function PageNumberCommandPlugin(): null {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    // Header komutu
    const unregisterHeader = editor.registerCommand(
      TOGGLE_HEADER_PAGE_NUMBER_COMMAND,
      () => {
        // Aktiflik state'ine göre ekle/çıkar
        const isActive = getHeaderPageNumberActive();
        editor.update(() => {
          addOrReplacePageNumbers({ header: isActive, footer: getFooterPageNumberActive() });
        });
        return true;
      },
      0
    );
    // Footer komutu
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

// HeaderPageNumberButton bileşeni
export function HeaderPageNumberButton(): JSX.Element {
  const toggleHeaderPageNumber = useHeaderPageNumberToggle();
  // Page number modunu toggle et
  const [active, setActive] = React.useState(getHeaderPageNumberActive());
  const handleClick = (): void => {
    setHeaderPageNumberActive(!active);
    setActive(!active);
    // Page number toggle işlemi tamamlandıktan sonra, page node ile ilgili işlemleri bir sonraki tick'e bırak
    toggleHeaderPageNumber();
    setTimeout(() => {
      // Burada page node ile ilgili işlemler tetiklenebilir (gerekirse)
      // Örn: page node'u kapatma veya yeni sayfa ekleme işlemi
    }, 0);
  };
  const [enabled, setEnabled] = React.useState(false);
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const pageNodes = root
          .getChildren()
          .filter((n: any) => typeof n.getType === 'function' && n.getType() === 'page');
        setEnabled(
          pageNodes.some((pageNode: any) => {
            const children = pageNode.getChildren();
            return (
              Array.isArray(children) &&
              children.some(
                (c: any) => typeof c.getType === 'function' && c.getType() === 'page-header'
              )
            );
          })
        );
      });
    });
  }, [editor]);
  return (
    <Toolbar.Button
      onClick={handleClick}
      disabled={!enabled}
      title={"Header'a Sayfa Numarası Ekle/Çıkar"}
      className={`toolbarButton${active ? ' active' : ''}`}
    >
      Header&apos;a Sayfa No{' '}
    </Toolbar.Button>
  );
}

// FooterPageNumberButton bileşeni
export function FooterPageNumberButton(): JSX.Element {
  const toggleFooterPageNumber = useFooterPageNumberToggle();
  // Page number modunu toggle et
  const [active, setActive] = React.useState(getFooterPageNumberActive());
  const handleClick = (): void => {
    setFooterPageNumberActive(!active);
    setActive(!active);
    // Page number toggle işlemi tamamlandıktan sonra, page node ile ilgili işlemleri bir sonraki tick'e bırak
    toggleFooterPageNumber();
    setTimeout(() => {
      // Burada page node ile ilgili işlemler tetiklenebilir (gerekirse)
      // Örn: page node'u kapatma veya yeni sayfa ekleme işlemi
    }, 0);
  };
  const [enabled, setEnabled] = React.useState(false);
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const pageNodes = root
          .getChildren()
          .filter((n: any) => typeof n.getType === 'function' && n.getType() === 'page');
        setEnabled(
          pageNodes.some((pageNode: any) =>
            pageNode
              .getChildren()
              .some((c: any) => typeof c.getType === 'function' && c.getType() === 'page-footer')
          )
        );
      });
    });
  }, [editor]);
  return (
    <Toolbar.Button
      onClick={handleClick}
      disabled={!enabled}
      title={"Footer'a Sayfa Numarası Ekle/Çıkar"}
      className={`toolbarButton${active ? ' active' : ''}`}
    >
      Footer&apos;a Sayfa No
    </Toolbar.Button>
  );
}
