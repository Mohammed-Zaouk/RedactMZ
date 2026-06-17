import { state } from "./state.js";

const pdfCanvas = document.getElementById("pdf-canvas");
const drawCanvas = document.getElementById("draw-canvas");
const pdfCtx = pdfCanvas.getContext("2d");
const drawCtx = drawCanvas.getContext("2d");

/**
 * initCanvas({ onRedactionAdded })
 * Sets up mouse-draw interaction on the overlay canvas.
 * Returns { renderPage, drawRedactions } for use by app.js.
 */
export function initCanvas({ onRedactionAdded }) {
  // ── Render ────────────────────────────────────────────────────────────────
  async function renderPage() {
    const page = await state.pdfDoc.getPage(state.pageNum);
    state.viewport = page.getViewport({ scale: state.scale });
    const { width, height } = state.viewport;

    pdfCanvas.width = drawCanvas.width = width;
    pdfCanvas.height = drawCanvas.height = height;

    await page.render({ canvasContext: pdfCtx, viewport: state.viewport })
      .promise;
    drawRedactions();
  }

  // ── Draw existing redactions on the overlay ───────────────────────────────
  function drawRedactions() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    const vp = state.viewport;
    if (!vp) return;

    state.redactions
      .filter((r) => r.page === state.pageNum)
      .forEach((r) => {
        const [cx, cy] = pdfToCanvas(r.x, r.y + r.h, vp);
        const [cx2, cy2] = pdfToCanvas(r.x + r.w, r.y, vp);
        drawCtx.fillStyle = r.color;
        drawCtx.fillRect(cx, cy, cx2 - cx, cy2 - cy);
      });
  }

  // ── Mouse interaction ─────────────────────────────────────────────────────
  drawCanvas.addEventListener("mousedown", (e) => {
    if (!state.pdfDoc) return;
    state.drawing = true;
    [state.startX, state.startY] = getCanvasPos(e);
  });

  drawCanvas.addEventListener("mousemove", (e) => {
    if (!state.drawing) return;
    const [cx, cy] = getCanvasPos(e);
    drawRedactions(); // redraw committed boxes first
    // preview rect
    drawCtx.fillStyle = state.currentColor;
    drawCtx.globalAlpha = 0.6;
    drawCtx.fillRect(
      Math.min(state.startX, cx),
      Math.min(state.startY, cy),
      Math.abs(cx - state.startX),
      Math.abs(cy - state.startY),
    );
    drawCtx.globalAlpha = 1;
  });

  drawCanvas.addEventListener("mouseup", (e) => {
    if (!state.drawing) return;
    state.drawing = false;

    const [ex, ey] = getCanvasPos(e);
    const cxMin = Math.min(state.startX, ex);
    const cyMin = Math.min(state.startY, ey);
    const cxMax = Math.max(state.startX, ex);
    const cyMax = Math.max(state.startY, ey);

    // ignore tiny accidental clicks
    if (Math.abs(cxMax - cxMin) < 4 || Math.abs(cyMax - cyMin) < 4) {
      drawRedactions();
      return;
    }

    const vp = state.viewport;
    const [x1, y1] = canvasToPdf(cxMin, cyMin, vp);
    const [x2, y2] = canvasToPdf(cxMax, cyMax, vp);

    state.redactions.push({
      page: state.pageNum,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
      color: state.currentColor,
    });

    drawRedactions();
    onRedactionAdded();
  });

  drawCanvas.addEventListener("mouseleave", () => {
    if (state.drawing) {
      state.drawing = false;
      drawRedactions();
    }
  });

  return { renderPage, drawRedactions };
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
// pdfjs origin: bottom-left in PDF space, top-left on canvas

function canvasToPdf(cx, cy, vp) {
  return vp.convertToPdfPoint(cx, cy);
}

function pdfToCanvas(px, py, vp) {
  return vp.convertToViewportPoint(px, py);
}

function getCanvasPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
}
