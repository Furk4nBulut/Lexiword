/**
 * EditModeContext
 *
 * Bu context, editörde header/footer düzenleme modunun (headerFooterEditMode) yönetilmesini sağlar.
 *
 * Sağlanan değerler:
 * - headerFooterEditMode: Header/footer düzenleme modu açık mı?
 * - setHeaderFooterEditMode: Modu değiştiren fonksiyon (opsiyonel, zorunlu değil)
 *
 * Kullanım Senaryosu:
 * - Kullanıcı header/footer alanlarını düzenlemek istediğinde, bu mod aktif edilir.
 * - EditModeProvider ile context sağlanır, useEditModeContext ile erişilir.
 *
 * Notlar:
 * - Provider'a verilen value nesnesi memoize edilir, böylece gereksiz render'lar önlenir.
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { setHeaderFooterSyncEnabled } from './HeaderFooterSyncModeContext';

export interface EditModeContextValue {
  headerFooterEditMode: boolean;
  setHeaderFooterEditMode?: (value: boolean) => void;
}

const EditModeContext = createContext<EditModeContextValue>({ headerFooterEditMode: false });

export function useEditModeContext(): EditModeContextValue {
  return useContext(EditModeContext);
}

export function EditModeProvider({
  value,
  children
}: {
  value: EditModeContextValue;
  children: React.ReactNode;
}): JSX.Element {
  // Edit mode değiştiğinde sync mode'u güncelle
  useEffect(() => {
    setHeaderFooterSyncEnabled(!value.headerFooterEditMode);
  }, [value.headerFooterEditMode]);

  const memo = useMemo(() => value, [value.headerFooterEditMode, value.setHeaderFooterEditMode]);
  return <EditModeContext.Provider value={memo}>{children}</EditModeContext.Provider>;
}
