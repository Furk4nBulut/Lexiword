import React from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useEditModeContext } from './context/EditModeContext';
import './styles.css';

/**
 * PageContentEditable
 *
 * Editörün ana içerik alanını temsil eden bileşen. Lexical'ın ContentEditable bileşenini kullanır.
 *
 * Sağladığı Özellikler:
 * - headerFooterEditMode aktifken içerik düzenlenemez (readonly olur)
 * - Alan dışına tıklanınca header/footer edit modu otomatik kapanır
 *
 * Kullanım Senaryosu:
 * - Kullanıcı header/footer düzenleme modundayken, içerik alanı kilitlenir
 * - Kullanıcı içerik alanına tıklayınca mod kapanır ve içerik tekrar düzenlenebilir olur
 */
export default function PageContentEditable(): JSX.Element {
  const { headerFooterEditMode, setHeaderFooterEditMode } = useEditModeContext();

  const handleClick = React.useCallback(() => {
    if (headerFooterEditMode && typeof setHeaderFooterEditMode === 'function') {
      setHeaderFooterEditMode(false);
    }
  }, [headerFooterEditMode, setHeaderFooterEditMode]);

  return (
    <div onClick={handleClick}>
      <ContentEditable contentEditable={!headerFooterEditMode} />
    </div>
  );
}
