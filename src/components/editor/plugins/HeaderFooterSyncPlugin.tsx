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
        // Tüm sayfalardaki header/footer'ları topla
        const pageNodes = root.getChildren().filter($isPageNode);
        let changedHeader: { text: string; visible: boolean } | null = null;
        let changedFooter: { text: string; visible: boolean } | null = null;
        // Header değişikliği tespiti
        for (const page of pageNodes) {
          const header = page.getHeaderNode();
          if (header != null) {
            if (
              lastHeader.current == null ||
              lastHeader.current.text !== header.__text ||
              lastHeader.current.visible !== header.__visible
            ) {
              changedHeader = { text: header.__text, visible: header.__visible };
              break;
            }
          }
        }
        // Footer değişikliği tespiti
        for (const page of pageNodes) {
          const footer = page.getFooterNode();
          if (footer != null) {
            if (
              lastFooter.current == null ||
              lastFooter.current.text !== footer.__text ||
              lastFooter.current.visible !== footer.__visible
            ) {
              changedFooter = { text: footer.__text, visible: footer.__visible };
              break;
            }
          }
        }
        // Değişiklik yapılan header'ı tüm sayfalara uygula
        if (changedHeader != null) {
          editor.update(() => {
            updateAllHeaders(changedHeader!.text, changedHeader!.visible);
          });
          lastHeader.current = changedHeader;
        }
        // Değişiklik yapılan footer'ı tüm sayfalara uygula
        if (changedFooter != null) {
          editor.update(() => {
            updateAllFooters(changedFooter!.text, changedFooter!.visible);
          });
          lastFooter.current = changedFooter;
        }
      });
    });
  }, [editor]);

  return null;
}
