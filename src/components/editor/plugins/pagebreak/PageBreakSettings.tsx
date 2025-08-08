export interface PageBreakSettings {
  pageHeight: number; // mm
  pageWidth: number; // mm
  marginTop: number; // mm
  marginBottom: number; // mm
  marginLeft: number; // mm
  marginRight: number; // mm
}

export const DEFAULT_PAGINATION_SETTINGS: PageBreakSettings = {
  pageHeight: 297, // A4 height
  pageWidth: 210,
  marginTop: 0,
  marginBottom: 25,
  marginLeft: 20,
  marginRight: 20
};
