import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getRoot } from 'lexical';
import { $createPageNode, $isPageNode } from '../nodes/PageNode';

export function usePageObserver(): void {
  const [editor] = useLexicalComposerContext();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    function setupObserver(): void {
      // Disconnect previous observer
      observerRef.current?.disconnect();

      const rootElement = editor.getRootElement();
      if (!rootElement) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              const pageElement = target.closest('[data-lexical-node-key]') as HTMLElement | null;

              editor.update(() => {
                const root = $getRoot();

                if (pageElement) {
                  const key = pageElement.getAttribute('data-lexical-node-key');
                  if (!key) return;
                  const node = $getNodeByKey(key);
                  if ($isPageNode(node)) {
                    const nextSibling = node.getNextSibling();
                    if (!$isPageNode(nextSibling)) {
                      const newPage = $createPageNode();
                      node.insertAfter(newPage);
                      const firstChild = newPage.getFirstChild();
                      if (firstChild) firstChild.selectStart();
                    }
                  }
                } else {
                  // Fallback: ensure at least one page exists
                  const lastChild = root.getLastChild();
                  if (!$isPageNode(lastChild)) {
                    const newPage = $createPageNode();
                    root.append(newPage);
                  }
                }
              });
            }
          }
        },
        {
          // Observe relative to viewport for simplicity
          root: null,
          threshold: 1.0,
          rootMargin: '0px 0px 200px 0px' // pre-emptive creation before exact bottom
        }
      );

      observerRef.current = observer;

      // Attach observer to all sentinels
      const sentinels = rootElement.querySelectorAll('.page-observer-target');
      sentinels.forEach((el) => observer.observe(el));
    }

    // Initial setup after mount and DOM paint
    const raf = requestAnimationFrame(setupObserver);

    // Re-attach observers on editor updates (DOM may change)
    const unregister = editor.registerUpdateListener(() => {
      // Wait for DOM reconciliation, then re-attach
      setTimeout(setupObserver, 0);
    });

    return () => {
      cancelAnimationFrame(raf);
      unregister();
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [editor]);
} 