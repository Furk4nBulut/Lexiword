import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot } from 'lexical';
import { HEADER_FOOTER_SYNC_ENABLED } from '../context/HeaderFooterSyncModeContext';
import { $isPageNode, type PageNode } from '../nodes/PageNode';
import { getReferenceSectionJSON, applySectionJSONToAll } from '../utils/headerFooterUtils';

// Sade ve tek fonksiyon: HeaderFooterSyncPlugin
export function HeaderFooterSyncPlugin(): JSX.Element | null {
  // Sync kapalıysa hiçbir şey yapma
  if (!HEADER_FOOTER_SYNC_ENABLED) return null;
  const [editor] = useLexicalComposerContext();
  // Son düzenlenen header/footer'ın key'ini saklamak için ref kullanıyoruz
  const lastEditedHeaderKey = useRef<string | null>(null);
  const lastEditedFooterKey = useRef<string | null>(null);
  // Sonsuz döngüyü engellemek için reentrancy guard
  const isSyncingRef = useRef(false);

  // DOM event listener ekle: Her header/footer'a input/focus event'i ile key'i güncelle
  useEffect(() => {
    function handleInputOrFocus(e: Event): void {
      const el = e.target as HTMLElement;
      const key = el.getAttribute('data-lexical-node-key');
      if (el.classList.contains('a4-header')) {
        lastEditedHeaderKey.current = key;
      } else if (el.classList.contains('a4-footer')) {
        lastEditedFooterKey.current = key;
      }
    }
    // Tüm header/footer DOM'larına event listener ekle
    function addListeners(): void {
      document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
        el.addEventListener('input', handleInputOrFocus);
        el.addEventListener('focus', handleInputOrFocus);
      });
    }
    function removeListeners(): void {
      document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
        el.removeEventListener('input', handleInputOrFocus);
        el.removeEventListener('focus', handleInputOrFocus);
      });
    }
    addListeners();
    // Her Lexical güncellemesinde tekrar ekle (çünkü DOM değişebilir)
    const cleanup = editor.registerUpdateListener(() => {
      removeListeners();
      addListeners();
    });
    return () => {
      removeListeners();
      cleanup();
    };
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (isSyncingRef.current) return;
      let pageNodes: PageNode[] = [];
      editorState.read(() => {
        const root = $getRoot();
        pageNodes = root.getChildren().filter($isPageNode);
      });
      // Eger yeterli sayfa yoksa atla
      if (pageNodes.length < 2) return;

      const refHeaderJSON = getReferenceSectionJSON(
        pageNodes,
        lastEditedHeaderKey.current,
        'header'
      );
      const refFooterJSON = getReferenceSectionJSON(
        pageNodes,
        lastEditedFooterKey.current,
        'footer'
      );
      if (refHeaderJSON === null && refFooterJSON === null) return;

      editor.update(() => {
        if (isSyncingRef.current) return;
        let didSync = false;
        if (Array.isArray(refHeaderJSON) && refHeaderJSON.length > 0) {
          const headerSynced = applySectionJSONToAll(
            pageNodes,
            'header',
            refHeaderJSON,
            isSyncingRef
          );
          didSync = didSync || headerSynced;
        }
        if (Array.isArray(refFooterJSON) && refFooterJSON.length > 0) {
          const footerSynced = applySectionJSONToAll(
            pageNodes,
            'footer',
            refFooterJSON,
            isSyncingRef
          );
          didSync = didSync || footerSynced;
        }
        if (didSync) {
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 0);
        }
      });
    });
  }, [editor]);
  return null;
}
