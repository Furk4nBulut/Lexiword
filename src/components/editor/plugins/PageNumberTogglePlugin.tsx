import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createPageNumberNode } from '../nodes/PageNumberNode';
import type { PageNode } from '../nodes/PageNode';
import { useCallback } from 'react';

/**
 * PageNumberTogglePlugin
 *
 * Bu dosya, Lexical editöründe sayfa numarası ekleme/kaldırma işlevselliğini sağlayan bir React hook'u ve opsiyonel bir buton bileşeni içerir.
 *
 * - usePageNumberToggle: Tüm sayfalara PageNumberNode ekler veya kaldırır. Toggle mantığı ile çalışır.
 * - PageNumberToggleButton: Kullanıcıya hazır bir buton sunar, ister Toolbar'da ister başka bir yerde kullanılabilir.
 *
 * Kullanım örneği:
 *   const togglePageNumbers = usePageNumberToggle();
 *   <button onClick={togglePageNumbers}>Sayfa Numarası Ekle/Kaldır</button>
 *
 * @author Furkan Bulut
 * @date 2025-08-15
 */
/**
 * usePageNumberToggle
 *
 * Tüm sayfalara PageNumberNode ekler veya kaldırır. Eğer herhangi bir sayfada PageNumberNode varsa hepsini siler, yoksa ekler.
 *
 * @returns {() => void} - Toggle fonksiyonu
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
/**
 * PageNumberToggleButton
 *
 * Hazır bir buton bileşeni. Tıklandığında sayfa numaralarını ekler/kaldırır.
 *
 * @param children - Butonun içeriği (varsayılan: 'Sayfa Numarası Ekle/Kaldır')
 * @param props - Diğer button props'ları
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
