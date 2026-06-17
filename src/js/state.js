/**
 * Single shared state object.
 * All modules import this and mutate it in place —
 * avoids prop-drilling while staying simple (no reactive framework needed).
 */
export const state = {
  // pdfjs document instance
  pdfDoc: null,
  // raw ArrayBuffer of the original file (used by exporter)
  pdfBytes: null,
  // original file name (used by exporter for suggested save name)
  fileName: null,
  // current page (1-indexed)
  pageNum: 1,
  // total page count in the loaded PDF
  totalPages: 0,
  // render scale (1.5 = 150% of original PDF points → canvas pixels)
  scale: 1.5,
  // pdfjs viewport of the currently rendered page
  viewport: null,
  // array of { page, x, y, w, h, color } — coords in PDF user units
  redactions: [],
  // draw-interaction state
  drawing: false,
  startX: 0,
  startY: 0,
  // currently selected fill color (hex string)
  currentColor: "#000000",
};
