export interface PageBreakSettings {
  pageHeight: number; // mm
  pageWidth: number; // mm
  marginTop: number; // mm
  marginBottom: number; // mm
  marginLeft: number; // mm
  marginRight: number; // mm
}

export const DEFAULT_PAGINATION_SETTINGS: PageBreakSettings = {
  pageHeight: 297, // A4 height in mm
  pageWidth: 210,  // A4 width in mm
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 25,
  marginRight: 25
};
