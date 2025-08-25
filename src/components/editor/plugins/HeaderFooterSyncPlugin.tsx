/**
 * HeaderFooterSyncPlugin
 *
 * Header ve footer içeriklerinin tüm sayfalar arasında senkronize tutulmasını sağlar.
 * Bir header/footer düzenlendiğinde referans alınıp diğer sayfalara uygulanır.
 *
 * @returns null (sadece yan etki için)
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot } from 'lexical';
import { HEADER_FOOTER_SYNC_ENABLED } from '../context/HeaderFooterSyncModeContext';
import { $isPageNode, type PageNode } from '../nodes/PageNode';
import { getReferenceSectionJSON, applySectionJSONToAll } from '../utils/headerFooterUtils';

// Sade ve tek fonksiyon: HeaderFooterSyncPlugin
export function HeaderFooterSyncPlugin(): JSX.Element | null {
  // Sync kapalıysa hiçbir şey yapma
  if (!HEADER_FOOTER_SYNC_ENABLED) return null; // Senkronizasyon devre dışıysa çık
  const [editor] = useLexicalComposerContext(); // Lexical editor instance
  // Son düzenlenen header/footer'ın key'ini saklamak için ref kullanıyoruz
  const lastEditedHeaderKey = useRef<string | null>(null); // Son düzenlenen header key
  const lastEditedFooterKey = useRef<string | null>(null); // Son düzenlenen footer key
  // Sonsuz döngüyü engellemek için reentrancy guard
  const isSyncingRef = useRef(false); // Senkronizasyon sırasında tekrar tetiklenmeyi engeller

  // DOM event listener ekle: Her header/footer'a input/focus event'i ile key'i güncelle
  useEffect(() => {
    // Header/footer DOM'una input/focus event'i ile key güncelleyen handler
    function handleInputOrFocus(e: Event): void {
      const el = e.target as HTMLElement; // Event kaynağı element
      const key = el.getAttribute('data-lexical-node-key'); // Node key'i al
      if (el.classList.contains('a4-header')) {
        lastEditedHeaderKey.current = key; // Header ise header key güncelle
      } else if (el.classList.contains('a4-footer')) {
        lastEditedFooterKey.current = key; // Footer ise footer key güncelle
      }
    }
    // Tüm header/footer DOM'larına event listener ekle
    function addListeners(): void {
      document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
        el.addEventListener('input', handleInputOrFocus); // input event
        el.addEventListener('focus', handleInputOrFocus); // focus event
      });
    }
    // Event listener'ları kaldır
    function removeListeners(): void {
      document.querySelectorAll('.a4-header, .a4-footer').forEach((el) => {
        el.removeEventListener('input', handleInputOrFocus);
        el.removeEventListener('focus', handleInputOrFocus);
      });
    }
    addListeners(); // İlk başta ekle
    // Her Lexical güncellemesinde tekrar ekle (çünkü DOM değişebilir)
    const cleanup = editor.registerUpdateListener(() => {
      removeListeners(); // Öncekileri kaldır
      addListeners(); // Yeniden ekle
    });
    return () => {
      removeListeners(); // Unmount'ta kaldır
      cleanup(); // Lexical listener'ı kaldır
    };
  }, [editor]);

  // Header/footer değişikliklerini diğer sayfalara uygula
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (isSyncingRef.current) return; // Döngü engelleme
      // pageNodes ve referans JSON'ları read bloğu içinde topla
      let pageNodes: PageNode[] = [];
      let refHeaderJSON: any[] | null = null;
      let refFooterJSON: any[] | null = null;
      editorState.read(() => {
        const root = $getRoot(); // Kök node
        pageNodes = root.getChildren().filter($isPageNode); // Tüm page node'ları
        if (pageNodes.length < 2) return; // Tek sayfa varsa gerek yok
        refHeaderJSON = getReferenceSectionJSON(pageNodes, lastEditedHeaderKey.current, 'header'); // Header referansı
        refFooterJSON = getReferenceSectionJSON(pageNodes, lastEditedFooterKey.current, 'footer'); // Footer referansı
      });
      if (pageNodes.length < 2) return; // Tek sayfa varsa çık
      if (refHeaderJSON === null && refFooterJSON === null) return; // Hiç referans yoksa çık

      editor.update(() => {
        if (isSyncingRef.current) return; // Döngü engelleme
        let didSync = false; // Senkronizasyon oldu mu?
        if (Array.isArray(refHeaderJSON) && refHeaderJSON.length > 0) {
          const headerSynced = applySectionJSONToAll(
            pageNodes,
            'header',
            refHeaderJSON,
            isSyncingRef
          ); // Header'ı uygula
          didSync = didSync || headerSynced;
        }
        if (Array.isArray(refFooterJSON) && refFooterJSON.length > 0) {
          const footerSynced = applySectionJSONToAll(
            pageNodes,
            'footer',
            refFooterJSON,
            isSyncingRef
          ); // Footer'ı uygula
          didSync = didSync || footerSynced;
        }
        if (didSync) {
          setTimeout(() => {
            isSyncingRef.current = false; // Senkronizasyon bitti
          }, 0);
        }
      });
    });
  }, [editor]);
  return null; // Plugin sadece yan etki için, render etmez
}
