/**
 * PageNumber UI bileşenleri
 *
 * Bu dosya, toolbar içinde kullanılan Header / Footer page-number
 * butonlarını içerir. Komut dispatch ve state yönetimi `commands.ts`
 * dosyasında tanımlıdır; UI burada sadece user interaction (butonlar)
 * ve görünürlük kontrolü ile ilgilenir.
 */
import * as React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useHeaderPageNumberToggle, useFooterPageNumberToggle } from './commands';
import {
  setHeaderPageNumberActive,
  setFooterPageNumberActive,
  getHeaderPageNumberActive,
  getFooterPageNumberActive
} from '../PageAutoSplitPlugin';

/**
 * HeaderPageNumberButton
 *
 * Header sayfa numarası modunu toggle eden toolbar butonu.
 */
export function HeaderPageNumberButton(): JSX.Element {
  const toggleHeaderPageNumber = useHeaderPageNumberToggle();
  const [active, setActive] = React.useState(getHeaderPageNumberActive());
  const handleClick = (): void => {
    setHeaderPageNumberActive(!active);
    setActive(!active);
    toggleHeaderPageNumber();
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
      Header&apos;a Sayfa No
    </Toolbar.Button>
  );
}

/**
 * FooterPageNumberButton
 *
 * Footer sayfa numarası modunu toggle eden toolbar butonu.
 */
export function FooterPageNumberButton(): JSX.Element {
  const toggleFooterPageNumber = useFooterPageNumberToggle();
  const [active, setActive] = React.useState(getFooterPageNumberActive());
  const handleClick = (): void => {
    setFooterPageNumberActive(!active);
    setActive(!active);
    toggleFooterPageNumber();
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
