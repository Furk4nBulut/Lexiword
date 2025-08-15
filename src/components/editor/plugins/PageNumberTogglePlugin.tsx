import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createPageNumberNode } from '../nodes/PageNumberNode';
import type { PageNode } from '../nodes/PageNode';
import { useCallback } from 'react';

/**
 * PageNumberTogglePlugin
 *
 * Toolbar veya başka bir yerden çağrılabilen, tüm sayfalara page number ekleyen veya kaldıran bir plugin.
 *
 * Kullanım:
 *   const togglePageNumbers = usePageNumberToggle();
 *   <button onClick={togglePageNumbers}>Sayfa Numarası Ekle/Kaldır</button>
 */
export function usePageNumberToggle(): () => void {
  const [editor] = useLexicalComposerContext();

  return useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const pageNodes = root
        .getChildren()
        .filter(
          (n) => typeof (n as any).getType === 'function' && (n as any).getType() === 'page'
        ) as PageNode[];
      // Eğer herhangi bir sayfada PageNumberNode varsa, hepsini sil
      const hasAnyPageNumber = pageNodes.some((pageNode) =>
        pageNode
          .getChildren()
          .some(
            (c) =>
              typeof (c as any).getType === 'function' && (c as any).getType() === 'page-number'
          )
      );
      if (hasAnyPageNumber) {
        pageNodes.forEach((pageNode) => {
          pageNode.getChildren().forEach((child) => {
            if (
              typeof (child as any).getType === 'function' &&
              (child as any).getType() === 'page-number'
            ) {
              child.remove();
            }
          });
        });
      } else {
        pageNodes.forEach((pageNode, idx) => {
          const hasPageNumber = pageNode
            .getChildren()
            .some(
              (c) =>
                typeof (c as any).getType === 'function' && (c as any).getType() === 'page-number'
            );
          if (!hasPageNumber) {
            pageNode.append($createPageNumberNode(idx + 1));
          }
        });
      }
    });
  }, [editor]);
}

/**
 * PageNumberTogglePlugin (opsiyonel: otomatik buton render)
 *
 * Eğer otomatik bir buton da eklemek isterseniz aşağıdaki gibi bir React bileşeni olarak da kullanabilirsiniz.
 */
export function PageNumberToggleButton({
  children = 'Sayfa Numarası Ekle/Kaldır',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  const togglePageNumbers = usePageNumberToggle();
  return (
    <button type="button" onClick={togglePageNumbers} {...props}>
      {children}
    </button>
  );
}
