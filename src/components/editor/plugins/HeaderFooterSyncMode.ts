// HeaderFooterSyncMode.ts
// Global sync mode state and command for header/footer sync control
import { createCommand } from 'lexical';

// true: sync aktif, false: sync pasif
export let HEADER_FOOTER_SYNC_ENABLED = true;

export const SET_HEADER_FOOTER_SYNC_ENABLED_COMMAND = createCommand<boolean>(
  'SET_HEADER_FOOTER_SYNC_ENABLED_COMMAND'
);

export function setHeaderFooterSyncEnabled(enabled: boolean): void {
  HEADER_FOOTER_SYNC_ENABLED = enabled;
}
