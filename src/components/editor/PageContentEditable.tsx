import React from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useEditModeContext } from './context/EditModeContext';
import './styles.css';

/**
 * Profesyonelce: Edit mode kontrolü ve tıklama davranışı burada yönetilir.
 * Görsel olarak da "disabled" efekti eklenir.
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
