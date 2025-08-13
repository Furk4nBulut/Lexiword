import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $getRoot } from 'lexical';
import { updateAllHeaders, updateAllFooters } from './HeaderFooterSyncUtils';
import { $isPageNode } from '../nodes/PageNode';

/**
 * Bu plugin, header/footer edit modundayken bir header/footer değişikliği olduğunda
tüm sayfalardaki header/footer'ı otomatik olarak günceller.
 */
export function HeaderFooterSyncPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const lastHeader = useRef<{ text: string; visible: boolean } | null>(null);
  const lastFooter = useRef<{ text: string; visible: boolean } | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        let headerText = '';
        let headerVisible = false;
        let footerText = '';
        let footerVisible = false;
        // İlk sayfanın header/footer'ını referans al
        const firstPage = root.getChildren().find((node) => $isPageNode(node));
        if (firstPage != null) {
          const header = firstPage.getHeaderNode();
          if (header != null) {
            headerText = header.__text;
            headerVisible = header.__visible;
          }
          const footer = firstPage.getFooterNode();
          if (footer != null) {
            footerText = footer.__text;
            footerVisible = footer.__visible;
          }
        }
        // Sadece değişiklik varsa güncelle
        if (
          lastHeader.current?.text !== headerText ||
          lastHeader.current?.visible !== headerVisible
        ) {
          editor.update(() => {
            updateAllHeaders(headerText, headerVisible);
          });
          lastHeader.current = { text: headerText, visible: headerVisible };
        }
        if (
          lastFooter.current?.text !== footerText ||
          lastFooter.current?.visible !== footerVisible
        ) {
          editor.update(() => {
            updateAllFooters(footerText, footerVisible);
          });
          lastFooter.current = { text: footerText, visible: footerVisible };
        }
      });
    });
  }, [editor]);

  return null;
}
