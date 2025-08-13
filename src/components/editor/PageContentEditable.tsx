import React from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useEditModeContext } from './EditModeContext';
import './styles.css';

/**
 * Profesyonelce: Edit mode kontrolü ve tıklama davranışı burada yönetilir.
 * Görsel olarak da "disabled" efekti eklenir.
 */
export default function PageContentEditable() {
  const { headerFooterEditMode, setHeaderFooterEditMode } = useEditModeContext();

  const handleClick = React.useCallback(() => {
    if (headerFooterEditMode && setHeaderFooterEditMode) {
      setHeaderFooterEditMode(false);
    }
  }, [headerFooterEditMode, setHeaderFooterEditMode]);

  return (
    <div onClick={handleClick}>
      <ContentEditable contentEditable={!headerFooterEditMode} />
    </div>
  );
}
