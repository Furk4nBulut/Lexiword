import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// A4 yüksekliği: 1122px (96dpi için)
const A4_HEIGHT_PX = 1122;

export function A4PageLimitPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const checkA4Limit = () => {
      const page = document.querySelector('.a4-page');
      if (page) {
        const height = page.scrollHeight;
        if (height > A4_HEIGHT_PX) {
          page.classList.add('a4-limit-exceeded');
        } else {
          page.classList.remove('a4-limit-exceeded');
        }
      }
    };
    editor.registerUpdateListener(() => {
      checkA4Limit();
    });
    // İlk render'da da kontrol et
    setTimeout(checkA4Limit, 100);
  }, [editor]);

  return null;
}

