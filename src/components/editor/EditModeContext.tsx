import React, { createContext, useContext, useMemo } from 'react';

export interface EditModeContextValue {
  headerFooterEditMode: boolean;
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
  const memo = useMemo(() => value, [value.headerFooterEditMode]);
  return <EditModeContext.Provider value={memo}>{children}</EditModeContext.Provider>;
}
