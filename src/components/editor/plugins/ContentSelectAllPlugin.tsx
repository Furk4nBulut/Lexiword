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

// Helper: Tüm PageContentNode'ları bul (dışarı taşıdık)
function getAllContentNodes(): any[] {
  const rootNode = $getRoot();
  if (rootNode == null) return [];
  const allContentNodes: any[] = [];
  rootNode.getChildren().forEach((pageNode: any) => {
    if (typeof pageNode.getChildren === 'function') {
      pageNode.getChildren().forEach((child: any) => {
        if (isContentNode(child)) {
          allContentNodes.push(child);
        }
      });
    }
  });
  return allContentNodes;
}

export function ContentSelectAllPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const blockInputRef = useRef(false);

  useEffect(() => {
    // Delete/backspace ile tüm content node'larını temizle
    const handleDeleteAllContent = (event: KeyboardEvent): boolean => {
      // Sadece .a4-content aktifken ve tüm content seçiliyken çalışsın
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return false;
      let contentElement: HTMLElement | null = null;
      if (active.classList.contains('a4-content')) {
        contentElement = active;
      } else {
        contentElement = active.querySelector('.a4-content');
      }
      if (contentElement === null) return false;
      // Sadece delete/backspace ise
      if (event.key !== 'Delete' && event.key !== 'Backspace') return false;
      // Seçim tüm content node'larını kapsıyor mu?
      const allContentNodes = editor.getEditorState().read(getAllContentNodes);
      if (allContentNodes.length === 0) return false;
      // Lexical selection kontrolü
      const selection = window.getSelection();
      if (selection == null || selection.isCollapsed) return false;
      // DOM'da .a4-content dışında bir şey seçiliyse engelleme
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
      if (allInContent) {
        // Eğer sadece 1 tane page node varsa hiçbir şey silme
        event.preventDefault();
        event.stopPropagation();
        editor.update(() => {
          const root = $getRoot();
          // Tüm page node'larını bul
          const pages = root
            .getChildren()
            .filter((n) => typeof n.getType === 'function' && n.getType() === 'page');
          if (pages.length > 1) {
            // Son page node'u hariç hepsini sil
            for (let i = 0; i < pages.length - 1; i++) {
              pages[i].remove();
            }
          }
          // Her durumda (tek veya çok sayfa) sadece son page'in content node'unun çocuklarını sil
          const lastPage = pages.length > 0 ? pages[pages.length - 1] : null;
          if (lastPage !== null) {
            const contentNode = lastPage
              .getChildren()
              .find((c: any) => typeof c.getType === 'function' && c.getType() === 'page-content');
            if (Boolean(contentNode) && typeof contentNode.getChildren === 'function') {
              const children = contentNode.getChildren();
              for (const child of children) {
                if (typeof child.remove === 'function') {
                  child.remove();
                }
              }
              // Silme sonrası selection'ı content node'un başına ayarla
              const selection = $createRangeSelection();
              selection.anchor.set(contentNode.getKey(), 0, 'element');
              selection.focus.set(contentNode.getKey(), 0, 'element');
              $setSelection(selection);
            }
          }
        });
        return true;
      }
      return false;
    };

    // Sadece .a4-content dışında paste'i engelle
    const unregisterSelectAll = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent): boolean => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) {
          return false;
        }
        let contentElement: HTMLElement | null = null;
        if (active.classList.contains('a4-content')) {
          contentElement = active;
        } else {
          contentElement = active.querySelector('.a4-content');
        }
        if (contentElement === null) {
          return false;
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
          event.preventDefault();
          editor.update(() => {
            const allContentNodes = getAllContentNodes();
            if (allContentNodes.length === 0) return;
            // Tüm content node'lar içindeki ilk ve son text node'u bul
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
            const firstContent = allContentNodes[0];
            const lastContent = allContentNodes[allContentNodes.length - 1];
            const firstText = findFirstTextNode(firstContent) ?? firstContent;
            const lastText = findLastTextNode(lastContent) ?? lastContent;
            const selection = $createRangeSelection();
            selection.anchor.set(firstText.getKey(), 0, 'text');
            selection.focus.set(lastText.getKey(), lastText.getTextContent().length, 'text');
            $setSelection(selection);
            // Her PageContentNode'un getTextContent() ile içeriğini sırayla birleştirip panoya kopyala
            const contentText = allContentNodes
              .map((node) =>
                typeof node.getTextContent === 'function' ? node.getTextContent() : ''
              )
              .join('\n');
            if (typeof contentText === 'string') {
              navigator.clipboard
                .writeText(contentText)
                .then(() => {
                  blockInputRef.current = true;
                  setTimeout(() => {
                    blockInputRef.current = false;
                  }, 120);
                })
                .catch(() => {
                  blockInputRef.current = true;
                  setTimeout(() => {
                    blockInputRef.current = false;
                  }, 120);
                });
            } else {
              blockInputRef.current = true;
              setTimeout(() => {
                blockInputRef.current = false;
              }, 120);
            }
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    // Delete/backspace tuşunu yakala (capture phase, root elemde)
    const rootElem = editor.getRootElement?.();
    if (rootElem !== null && rootElem !== undefined) {
      rootElem.addEventListener('keydown', handleDeleteAllContent, true);
    }

    // Ctrl+C kopyalama komutunu yakala
    const unregisterCopy = editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent): boolean => {
        // Eğer seçim tüm content node'larını kapsıyorsa, sadece contentText'i kopyala
        const allContentNodes = getAllContentNodes();
        if (allContentNodes.length === 0) return false;
        // Seçim anchor/focus ilk ve son content node'da mı?
        const selection = window.getSelection();
        if (selection == null) return false;
        // DOM'da .a4-content dışında bir şey seçiliyse engelleme
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
        if (allInContent) {
          const contentText = allContentNodes
            .map((node) => (typeof node.getTextContent === 'function' ? node.getTextContent() : ''))
            .join('\n');
          event.preventDefault();
          event.stopPropagation();
          if (typeof contentText === 'string') {
            event.clipboardData?.setData('text/plain', contentText);
          }
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    // Input'u engellemek için event listener ekle
    const handleBeforeInput = (e: InputEvent): void => {
      if (blockInputRef.current) {
        console.debug('[ContentSelectAllPlugin] Input blocked');
        e.preventDefault();
      }
    };

    // Odağı kaybedince tekrar yazmaya izin ver
    const handleBlur = (): void => {
      blockInputRef.current = false;
      console.debug('[ContentSelectAllPlugin] Input unblocked (blur)');
    };

    // Sadece .a4-content dışında paste'i engelle (parent'ları da kontrol et)
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

    if (rootElem !== null && rootElem !== undefined) {
      rootElem.addEventListener('beforeinput', handleBeforeInput, true);
      rootElem.addEventListener('blur', handleBlur, true);
      rootElem.addEventListener('paste', handlePaste, true);
    }

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
