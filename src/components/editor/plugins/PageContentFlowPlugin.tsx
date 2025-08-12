import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  $isTextNode
} from 'lexical';
import { $isPageNode } from '../nodes/PageNode';
import { isContentNode } from '../nodes/sectionTypeGuards';

/**
 * PageContentFlowPlugin
 *
 * Eğer bir sayfa taşarsa (overflow), fazla içeriği otomatik olarak yeni sayfaya aktarır.
 * Bu plugin, PageAutoSplitPlugin ile birlikte çalışacak şekilde tasarlanmıştır.
 */
const PageContentFlowPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Her güncellemede çalışacak şekilde listener ekle
    const unregister = editor.registerUpdateListener(() => {
      editor.update(() => {
        const root = $getRoot();
        const pages = root.getChildren().filter($isPageNode);
        for (let i = 0; i < pages.length - 1; i++) {
          const page = pages[i];
          const nextPage = pages[i + 1];
          const contentNode = page.getChildren().find(isContentNode);
          const nextContentNode = nextPage.getChildren().find(isContentNode);
          if (contentNode == null || nextContentNode == null) { continue; }

          const el = editor.getElementByKey(contentNode.getKey());
          if (el == null) { continue; }
          const maxHeight = 1122 - 40; // örnek: 20px üst/alt margin
          // Sadece taşma varsa müdahale et
          if (el.scrollHeight > maxHeight + 2) {
            const blocks = contentNode.getChildren();
            if (blocks.length > 1) {
              // Sadece son bloğu taşı
              const lastBlock = blocks[blocks.length - 1];
              nextContentNode.append(lastBlock);
            } else if (blocks.length === 1) {
              // Tek blok varsa ve çok uzunsa, metni böl
              const block = blocks[0];
              if ($isElementNode(block)) {
                const textNodes = block.getChildren().filter($isTextNode);
                if (textNodes.length > 0) {
                  const t = textNodes[0];
                  const text = t.getTextContent();
                  if (text.length > 10) {
                    // Sadece taşan kısmı böl: örn. 1/3'ünü yeni sayfaya aktar
                    const splitAt = Math.floor(text.length * 2 / 3);
                    t.setTextContent(text.slice(0, splitAt));
                    const newBlock = block.clone();
                    newBlock.getChildren().forEach((c: any) => c.remove());
                    const newTextNode = t.clone();
                    newTextNode.setTextContent(text.slice(splitAt));
                    newBlock.append(newTextNode);
                    nextContentNode.append(newBlock);
                  }
                }
              }
            }
          }
        }
      });
    });
    return unregister;
  }, [editor]);

  return null;
};

export default PageContentFlowPlugin;
