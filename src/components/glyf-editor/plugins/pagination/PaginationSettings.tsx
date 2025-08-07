export interface PaginationSettings {
  pageHeight: number; // mm
  pageWidth: number; // mm
  marginTop: number; // mm
  marginBottom: number; // mm
  marginLeft: number; // mm
  marginRight: number; // mm
}

export const DEFAULT_PAGINATION_SETTINGS: PaginationSettings = {
  pageHeight: 297, // A4 height
  pageWidth: 210,
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 20,
  marginRight: 20
};

export const PAGINATION_PRESETS: Record<string, Partial<PaginationSettings>> = {
  A4: { pageWidth: 210, pageHeight: 297 },
  A3: { pageWidth: 297, pageHeight: 420 },
  Letter: { pageWidth: 216, pageHeight: 279 },
  Legal: { pageWidth: 216, pageHeight: 356 }
};
