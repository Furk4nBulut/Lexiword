/**
 * ContentSelectAllPlugin.tsx
 *
 * Bu plugin, Lexical editöründe Ctrl+A (veya Cmd+A) ve bazı kısayolları özelleştirerek
 * sadece `.a4-content` alanındaki içerik üzerinde işlem yapılmasına izin verir.
 *
 * Sağladığı Özellikler:
 * - Ctrl+A → Tüm `.a4-content` içeriğini seçer (dışarıyı seçmez).
 * - Delete/Backspace → Tüm içeriği siler ama her zaman 1 boş sayfa bırakır.
 * - Ctrl+C → Panoya sadece `.a4-content` metnini kopyalar.
 * - Ctrl+V → Sadece `.a4-content` içine yapıştırmaya izin verir.
 * - Kopyalama sonrası kısa süreli input kilidi ekler (selection bozulmasın diye).
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import {
  KEY_MODIFIER_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $getRoot,
  $setSelection,
  $createRangeSelection,
  COPY_COMMAND
} from 'lexical';
import { isContentNode } from '../nodes/sectionTypeGuards';

/**
 * Helper Fonksiyon: getAllContentNodes
 *
 * Editördeki tüm PageContentNode (yani `.a4-content` karşılığı) node'larını bulur ve döner.
 *
 * Dönüş:
 * - PageContentNode[] dizisi
 */
function getAllContentNodes(): any[] {
  const rootNode = $getRoot();
  if (rootNode == null) return [];
  const allContentNodes: any[] = [];

  // Root’un çocukları page node’lardır
  rootNode.getChildren().forEach((pageNode: any) => {
    if (typeof pageNode.getChildren === 'function') {
      // Her page node’un içindeki content node’larını bul
      pageNode.getChildren().forEach((child: any) => {
        if (isContentNode(child)) {
          allContentNodes.push(child);
        }
      });
    }
  });

  return allContentNodes;
}

/**
 * React Component: ContentSelectAllPlugin
 *
 * Lexical editör için bir React pluginidir. `useEffect` içinde global komutlar
 * ve event listener'lar kaydedilir. Bu listener'lar sayesinde:
 * - Ctrl+A → sadece içerik seçilir
 * - Delete/Backspace → içerik temizlenir ama en az 1 boş sayfa kalır
 * - Ctrl+C → içerik text’i panoya kopyalanır
 * - Ctrl+V → sadece içerik içine yapıştırılır
 */
export function ContentSelectAllPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  // Kopyalama sonrası kısa süre input’u engellemek için flag
  const blockInputRef = useRef(false);

  useEffect(() => {
    /**
     * Event Handler: handleDeleteAllContent
     *
     * Delete veya Backspace tuşuna basıldığında tetiklenir.
     * Eğer seçim `.a4-content` içindeyse:
     * - Birden fazla sayfa varsa → son sayfa hariç hepsi silinir.
     * - Son sayfanın content node’u içindeki tüm çocuklar temizlenir.
     * - Seçim (cursor) content node’un başına konumlanır.
     */
    const handleDeleteAllContent = (event: KeyboardEvent): boolean => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return false;

      // Aktif element `.a4-content` mi?
      let contentElement: HTMLElement | null = null;
      if (active.classList.contains('a4-content')) {
        contentElement = active;
      } else {
        contentElement = active.querySelector('.a4-content');
      }
      if (contentElement === null) return false;

      // Sadece Delete veya Backspace yakalansın
      if (event.key !== 'Delete' && event.key !== 'Backspace') return false;

      // İçerikte hiç content node yoksa çık
      const allContentNodes = editor.getEditorState().read(getAllContentNodes);
      if (allContentNodes.length === 0) return false;

      // Seçim gerçekten tüm içerikte mi yapılmış?
      const selection = window.getSelection();
      if (selection == null || selection.isCollapsed) return false;

      // DOM seviyesinde kontrol: seçim .a4-content dışına taşmış mı?
      let allInContent = true;
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        let startContainer = range.startContainer;
        let endContainer = range.endContainer;
        if (startContainer.nodeType === Node.TEXT_NODE) {
          startContainer = startContainer.parentElement as HTMLElement;
        }
        if (endContainer.nodeType === Node.TEXT_NODE) {
          endContainer = endContainer.parentElement as HTMLElement;
        }
        if (!(startContainer instanceof HTMLElement) || !(endContainer instanceof HTMLElement)) {
          allInContent = false;
          break;
        }
        const startClosest = startContainer.closest('.a4-content');
        const endClosest = endContainer.closest('.a4-content');
        if (startClosest === null || endClosest === null) {
          allInContent = false;
          break;
        }
      }

      // --- YENİ KONTROL: Seçim ilk content node'un başından son content node'un sonuna kadar mı? ---
      let fullySelected = false;
      if (allContentNodes.length > 0 && selection.rangeCount > 0) {
        const firstContentEl = editor.getElementByKey?.(allContentNodes[0]?.getKey?.());
        const lastContentEl = editor.getElementByKey?.(
          allContentNodes[allContentNodes.length - 1]?.getKey?.()
        );
        if (
          firstContentEl !== null &&
          firstContentEl !== undefined &&
          lastContentEl !== null &&
          lastContentEl !== undefined
        ) {
          // Anchor ve focus noktalarını bul
          const anchorNode = selection.anchorNode;
          const focusNode = selection.focusNode;
          // Anchor ve focus, page-content node'larının içinde mi?
          const anchorInContent =
            firstContentEl.contains(anchorNode) || anchorNode === firstContentEl;
          const focusInContent = lastContentEl.contains(focusNode) || focusNode === lastContentEl;
          // Seçim yönüne göre baş ve sonu kontrol et
          if (anchorInContent && focusInContent) {
            // Seçim aralığı ilk content'in başından son content'in sonuna kadar mı?
            // (Başlangıç ve bitiş offset'leri de kontrol edilebilir ama çoğu durumda bu yeterli)
            fullySelected = true;
          }
        }
      }

      if (allInContent && fullySelected) {
        // Default silme işlemini engelle
        event.preventDefault();
        event.stopPropagation();

        // Lexical güncellemesi başlat
        editor.update(() => {
          const root = $getRoot();
          // Tüm page node’larını bul
          const pages = root
            .getChildren()
            .filter((n) => typeof n.getType === 'function' && n.getType() === 'page');

          if (pages.length > 1) {
            // Son page hariç tüm sayfaları sil
            for (let i = 0; i < pages.length - 1; i++) {
              pages[i].remove();
            }
          }

          // Son page’in content node’unu temizle
          const lastPage = pages.length > 0 ? pages[pages.length - 1] : null;
          if (lastPage !== null) {
            const contentNode = lastPage
              .getChildren()
              .find((c: any) => typeof c.getType === 'function' && c.getType() === 'page-content');
            if (Boolean(contentNode) && typeof contentNode.getChildren === 'function') {
              // Çocukları sil
              const children = contentNode.getChildren();
              for (const child of children) {
                if (typeof child.remove === 'function') {
                  child.remove();
                }
              }

              // Cursor’u content’in başına taşı
              const selection = $createRangeSelection();
              selection.anchor.set(contentNode.getKey(), 0, 'element');
              selection.focus.set(contentNode.getKey(), 0, 'element');
              $setSelection(selection);
            }
          }
        });
        return true;
      }
      // Eğer seçim tüm içeriği kapsamıyorsa, normal silme devam etsin
      return false;
    };

    /**
     * Ctrl+A Override
     *
     * - Eğer `.a4-content` içindeysek default Ctrl+A iptal edilir.
     * - Bunun yerine tüm content node’lar seçilir.
     * - Ayrıca içerik text’i toplanıp panoya kopyalanır.
     */
    const unregisterSelectAll = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent): boolean => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return false;

        // `.a4-content` alanını bul
        let contentElement: HTMLElement | null = null;
        if (active.classList.contains('a4-content')) {
          contentElement = active;
        } else {
          contentElement = active.querySelector('.a4-content');
        }
        if (contentElement === null) return false;

        // Ctrl+A veya Cmd+A yakala
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
          event.preventDefault();

          editor.update(() => {
            const allContentNodes = getAllContentNodes();
            if (allContentNodes.length === 0) return;

            // Sadece page-content node'larını seç
            // Her bir content node'un ilk ve son text node'unu bul
            function findFirstTextNode(node: any): any {
              if (typeof node.getChildren !== 'function') return null;
              for (const child of node.getChildren()) {
                if (
                  typeof child.getTextContent === 'function' &&
                  child.getTextContent().length > 0 &&
                  typeof child.getType === 'function' &&
                  child.getType() === 'text'
                ) {
                  return child;
                }
                const found = findFirstTextNode(child);
                if (found !== null) return found;
              }
              return null;
            }

            function findLastTextNode(node: any): any {
              if (typeof node.getChildren !== 'function') return null;
              const children = node.getChildren();
              for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (
                  typeof child.getTextContent === 'function' &&
                  child.getTextContent().length > 0 &&
                  typeof child.getType === 'function' &&
                  child.getType() === 'text'
                ) {
                  return child;
                }
                const found = findLastTextNode(child);
                if (found !== null) return found;
              }
              return null;
            }

            // Sadece page-content node'larının ilk ve son text node'unu bul
            let firstText: any = null;
            let lastText: any = null;
            for (let i = 0; i < allContentNodes.length; i++) {
              const node = allContentNodes[i];
              const t = findFirstTextNode(node);
              if (t !== null) {
                firstText = t;
                break;
              }
            }
            for (let i = allContentNodes.length - 1; i >= 0; i--) {
              const node = allContentNodes[i];
              const t = findLastTextNode(node);
              if (t !== null) {
                lastText = t;
                break;
              }
            }
            // Eğer hiç text node yoksa, content node'un kendisini kullan
            if (firstText === null) firstText = allContentNodes[0];
            if (lastText === null) lastText = allContentNodes[allContentNodes.length - 1];
            // Seçim objesi oluştur ve ayarla (sadece content'ler, header/footer hariç)
            const selection = $createRangeSelection();
            selection.anchor.set(firstText.getKey(), 0, 'text');
            selection.focus.set(lastText.getKey(), lastText.getTextContent().length, 'text');
            $setSelection(selection);

            // Sadece page-content node'larının text'ini panoya yaz
            const contentText = allContentNodes
              .map((node) =>
                typeof node.getTextContent === 'function' ? node.getTextContent() : ''
              )
              .join('\n');

            if (typeof contentText === 'string') {
              navigator.clipboard.writeText(contentText).finally(() => {
                blockInputRef.current = true;
                setTimeout(() => {
                  blockInputRef.current = false;
                }, 120);
              });
            }
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    /**
     * Ctrl+C Override
     *
     * Eğer seçim tamamen `.a4-content` içindeyse → tüm içerik toplanıp panoya yazılır.
     * Böylece `.a4-content` dışındaki elementler kopyalanmaz.
     */
    const unregisterCopy = editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent): boolean => {
        const allContentNodes = getAllContentNodes();
        if (allContentNodes.length === 0) return false;

        // Sadece page-content node'larının text'ini kopyala, header/footer asla dahil olmasın
        event.preventDefault();
        event.stopPropagation();
        const contentText = allContentNodes
          .map((node) => (typeof node.getTextContent === 'function' ? node.getTextContent() : ''))
          .join('\n');
        if (typeof contentText === 'string') {
          event.clipboardData?.setData('text/plain', contentText);
        }
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    /**
     * Input Event Engelleme
     *
     * Eğer blockInputRef true ise (örneğin kopyalama sonrası),
     * input işlemleri kısa süreliğine engellenir.
     */
    const handleBeforeInput = (e: InputEvent): void => {
      if (blockInputRef.current) {
        console.debug('[ContentSelectAllPlugin] Input blocked');
        e.preventDefault();
      }
    };

    /**
     * Blur Event
     *
     * Editör focus kaybettiğinde input engeli kaldırılır.
     */
    const handleBlur = (): void => {
      blockInputRef.current = false;
      console.debug('[ContentSelectAllPlugin] Input unblocked (blur)');
    };

    /**
     * Paste Event
     *
     * Yapıştırma işlemleri sadece `.a4-content` içinde izinlidir.
     * Dışarıya yapıştırma engellenir.
     */
    const handlePaste = (e: ClipboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const contentParent = target?.closest?.('.a4-content');
      if (contentParent === null) {
        console.debug(
          '[ContentSelectAllPlugin] Paste blocked (not .a4-content)',
          target?.className
        );
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      console.debug('[ContentSelectAllPlugin] Paste allowed in .a4-content');
    };

    // Root elemde event listener’ları kaydet
    const rootElem = editor.getRootElement?.();
    if (rootElem !== null && rootElem !== undefined) {
      rootElem.addEventListener('keydown', handleDeleteAllContent, true);
      rootElem.addEventListener('beforeinput', handleBeforeInput, true);
      rootElem.addEventListener('blur', handleBlur, true);
      rootElem.addEventListener('paste', handlePaste, true);
    }

    // Cleanup: component unmount olduğunda listener’ları kaldır
    return () => {
      unregisterSelectAll();
      unregisterCopy();
      if (rootElem !== null && rootElem !== undefined) {
        rootElem.removeEventListener('beforeinput', handleBeforeInput, true);
        rootElem.removeEventListener('blur', handleBlur, true);
        rootElem.removeEventListener('paste', handlePaste, true);
        rootElem.removeEventListener('keydown', handleDeleteAllContent, true);
      }
    };
  }, [editor]);

  return null;
}
