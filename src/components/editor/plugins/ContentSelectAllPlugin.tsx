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
  $createRangeSelection
} from 'lexical';
import { isContentNode } from '../nodes/sectionTypeGuards';

export function ContentSelectAllPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const blockInputRef = useRef(false);

  useEffect(() => {
    // Sadece .a4-content dışında paste'i engelle
    const unregister = editor.registerCommand(
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
        console.debug('[ContentSelectAllPlugin] contentElement:', contentElement);
        if (contentElement === null) {
          console.debug('[ContentSelectAllPlugin] No .a4-content found in active element or its children');
          return false;
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
          console.debug('[ContentSelectAllPlugin] Ctrl+A detected, overriding default');
          event.preventDefault();
          editor.update(() => {
            const rootNode = $getRoot();
            if (rootNode == null) return;
            // Her PageNode'un altındaki tüm PageContentNode'ları sırayla ekle
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
            console.debug('[ContentSelectAllPlugin] allContentNodes found:', allContentNodes.map(n => n.getKey?.()));
            // Her content node'un altındaki çocukları ve içeriklerini debugla
            allContentNodes.forEach((node: any, idx: number) => {
              const children = typeof node.getChildren === 'function' ? node.getChildren() : [];
              console.debug(`[ContentSelectAllPlugin] ContentNode #${idx} (${node.getKey?.()}): children count:`, children.length);
              children.forEach((child: any, cidx: number) => {
                const type = typeof child.getType === 'function' ? child.getType() : typeof child;
                const text = typeof child.getTextContent === 'function' ? child.getTextContent() : undefined;
                console.debug(`[ContentSelectAllPlugin]   Child #${cidx}: type=${type}, text=`, text);
              });
            });
            if (allContentNodes.length === 0) {
              console.debug('[ContentSelectAllPlugin] No content nodes found');
              return;
            }
            // Tüm content node'lar içindeki ilk ve son text node'u bul
            function findFirstTextNode(node) {
              if (typeof node.getChildren !== 'function') return null;
              for (const child of node.getChildren()) {
                if (typeof child.getTextContent === 'function' && child.getTextContent().length > 0 && typeof child.getType === 'function' && child.getType() === 'text') {
                  return child;
                }
                const found = findFirstTextNode(child);
                if (found) return found;
              }
              return null;
            }
            function findLastTextNode(node) {
              if (typeof node.getChildren !== 'function') return null;
              const children = node.getChildren();
              for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (typeof child.getTextContent === 'function' && child.getTextContent().length > 0 && typeof child.getType === 'function' && child.getType() === 'text') {
                  return child;
                }
                const found = findLastTextNode(child);
                if (found) return found;
              }
              return null;
            }
            const firstContent = allContentNodes[0];
            const lastContent = allContentNodes[allContentNodes.length - 1];
            const firstText = findFirstTextNode(firstContent) || firstContent;
            const lastText = findLastTextNode(lastContent) || lastContent;
            const selection = $createRangeSelection();
            selection.anchor.set(firstText.getKey(), 0, 'text');
            selection.focus.set(lastText.getKey(), lastText.getTextContent().length, 'text');
            $setSelection(selection);
            // Her PageContentNode'un getTextContent() ile içeriğini sırayla birleştirip panoya kopyala
            const contentText = allContentNodes.map((node) => typeof node.getTextContent === 'function' ? node.getTextContent() : '').join('\n');
            console.debug('[ContentSelectAllPlugin] contentText to copy:', contentText);
            if (typeof contentText === 'string') {
              navigator.clipboard
                .writeText(contentText)
                .then(() => {
                  blockInputRef.current = true;
                  setTimeout(() => {
                    blockInputRef.current = false;
                    console.debug('[ContentSelectAllPlugin] Input auto-unblocked after copy');
                  }, 120);
                  console.debug('[ContentSelectAllPlugin] Copied to clipboard, input blocked (auto)');
                })
                .catch(() => {
                  blockInputRef.current = true;
                  setTimeout(() => {
                    blockInputRef.current = false;
                    console.debug('[ContentSelectAllPlugin] Input auto-unblocked after copy (fail)');
                  }, 120);
                  console.debug('[ContentSelectAllPlugin] Clipboard write failed, input blocked (auto)');
                });
            } else {
              blockInputRef.current = true;
              setTimeout(() => {
                blockInputRef.current = false;
                console.debug('[ContentSelectAllPlugin] Input auto-unblocked after copy (no string)');
              }, 120);
              console.debug('[ContentSelectAllPlugin] No string to copy, input blocked (auto)');
            }
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    // Tek bir rootElem tanımı
    const rootElem = editor.getRootElement?.();

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
      if (!contentParent) {
        console.debug('[ContentSelectAllPlugin] Paste blocked (not .a4-content)', target?.className);
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
      unregister();
      if (rootElem !== null && rootElem !== undefined) {
        rootElem.removeEventListener('beforeinput', handleBeforeInput, true);
        rootElem.removeEventListener('blur', handleBlur, true);
        rootElem.removeEventListener('paste', handlePaste, true);
      }
    };
  }, [editor]);

  return null;
}
