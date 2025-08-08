import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getRoot } from 'lexical';
import { $createPageNode, $isPageNode } from './PageNode';

export function usePageObserver(): void {
  const [editor] = useLexicalComposerContext();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    function setupObserver(): void {
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
        { root: null, threshold: 1.0, rootMargin: '0px 0px 200px 0px' }
      );

      observerRef.current = observer;

      const sentinels = rootElement.querySelectorAll('.page-observer-target');
      sentinels.forEach((el) => observer.observe(el));
    }

    const raf = requestAnimationFrame(setupObserver);

    const unregister = editor.registerUpdateListener(() => {
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