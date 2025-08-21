import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, ParagraphNode, TextNode, LineBreakNode, type SerializedParagraphNode, type SerializedTextNode, type SerializedLineBreakNode } from 'lexical';
import { useEffect } from 'react';
import { $isPageNode } from '../nodes/PageNode';

/**
 * PageCleanupPlugin
 *
 * İçeriği tamamen boş olan PageNode'ları otomatik olarak siler.
 * En az bir sayfa kalmasını garanti eder.
 */
export function PageCleanupPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter($isPageNode);
        if (pages.length <= 1) return; // En az bir sayfa kalsın
        // Silinecek sayfalar ve kalan sayfa
        const pagesToRemove = pages.filter((pageNode) => {
          const contentNode = pageNode.getChildren().find((c) => c.getType() === 'page-content');
          return (
            contentNode !== undefined &&
            contentNode !== null &&
            contentNode.getChildrenSize() === 0 // İçerik tamamen boşsa
          );
        });
        if (pagesToRemove.length === 0) return;
        // Sadece bir sayfa kalacaksa, kalan sayfa
        const remainingPages = pages.filter((p) => !pagesToRemove.includes(p));
        const remainingPage = remainingPages.length === 1 ? remainingPages[0] : null;
        // Silinen sayfanın header/footer'ı doluysa ve kalan sayfanın header/footer'ı boşsa, kopyala
        if (remainingPage != null && pagesToRemove.length === 1) {
          const removedPage = pagesToRemove[0];
          // Header
          const removedHeader = removedPage.getHeaderNode();
          const remainingHeader = remainingPage.getHeaderNode();
          if (removedHeader != null && remainingHeader != null) {
            const removedHeaderChildren = removedHeader.getChildren();
            const remainingHeaderChildren = remainingHeader.getChildren();
            const removedHeaderHasContent =
              removedHeaderChildren.length > 0 &&
              removedHeaderChildren.some(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() !== ''
              );
            const remainingHeaderIsEmpty =
              remainingHeaderChildren.length === 0 ||
              remainingHeaderChildren.every(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() === ''
              );
            if (removedHeaderHasContent && remainingHeaderIsEmpty) {
              remainingHeader.clear();
              // JSON ile taşı
              removedHeaderChildren.forEach((child) => {
                if (typeof child.exportJSON === 'function') {
                  const json = child.exportJSON();
                  // key alanını sil
                  if ('key' in json) delete json.key;
                  let imported = null;
                  if (json.type === 'paragraph') {
                    imported = ParagraphNode.importJSON(json as SerializedParagraphNode);
                  } else if (json.type === 'text') {
                    imported = TextNode.importJSON(json as SerializedTextNode);
                  } else if (json.type === 'linebreak') {
                    imported = LineBreakNode.importJSON(json as SerializedLineBreakNode);
                  }
                  if (imported != null) remainingHeader.append(imported);
                }
              });
            }
          }
          // Footer
          const removedFooter = removedPage.getFooterNode();
          const remainingFooter = remainingPage.getFooterNode();
          if (removedFooter != null && remainingFooter != null) {
            const removedFooterChildren = removedFooter.getChildren();
            const remainingFooterChildren = remainingFooter.getChildren();
            const removedFooterHasContent =
              removedFooterChildren.length > 0 &&
              removedFooterChildren.some(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() !== ''
              );
            const remainingFooterIsEmpty =
              remainingFooterChildren.length === 0 ||
              remainingFooterChildren.every(
                (n) => typeof n.getTextContent === 'function' && n.getTextContent() === ''
              );
            if (removedFooterHasContent && remainingFooterIsEmpty) {
              remainingFooter.clear();
              // JSON ile taşı
              removedFooterChildren.forEach((child) => {
                if (typeof child.exportJSON === 'function') {
                  const json = child.exportJSON();
                  // key alanını sil
                  if ('key' in json) delete json.key;
                  let imported = null;
                  if (json.type === 'paragraph') {
                    imported = ParagraphNode.importJSON(json as SerializedParagraphNode);
                  } else if (json.type === 'text') {
                    imported = TextNode.importJSON(json as SerializedTextNode);
                  } else if (json.type === 'linebreak') {
                    imported = LineBreakNode.importJSON(json as SerializedLineBreakNode);
                  }
                  if (imported != null) remainingFooter.append(imported);
                }
              });
            }
          }
        }
        // Sayfaları sil
        pagesToRemove.forEach((pageNode) => {
          pageNode.remove();
        });
      });
    });
  }, [editor]);

  return null;
}
