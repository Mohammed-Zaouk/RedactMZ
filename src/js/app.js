/* global pdfjsLib */
import { initCanvas } from "./canvas.js";
import { initSidebar } from "./sidebar.js";
import { initColorPicker } from "./colorPicker.js";
import { downloadRedacted } from "./exporter.js";
import { state } from "./state.js";

// ── PDF.js worker ─────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// ── Elements ──────────────────────────────────────────────────────────────────
const dropZone = document.getElementById("drop-zone");
const dropInput = document.getElementById("drop-input");
const fileInput = document.getElementById("file-input");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageInfo = document.getElementById("page-info");
const applyBtn = document.getElementById("apply-btn");
const clearBtn = document.getElementById("clear-btn");
const statusBar = document.getElementById("status-bar");

// ── Init sub-modules ──────────────────────────────────────────────────────────
const { renderPage, drawRedactions } = initCanvas({ onRedactionAdded });
const { updateList } = initSidebar({ onRedactionRemoved, clearBtn, applyBtn });
initColorPicker();

// ── File loading ──────────────────────────────────────────────────────────────
async function loadFile(file) {
  if (!file || file.type !== "application/pdf") {
    setStatus("Please drop a valid PDF file.");
    return;
  }

  state.pdfBytes = await file.arrayBuffer();
  state.fileName = file.name;
  state.pdfDoc = await pdfjsLib.getDocument(state.pdfBytes.slice(0)).promise;
  state.totalPages = state.pdfDoc.numPages;
  state.pageNum = 1;
  state.redactions = [];

  dropZone.classList.add("hidden");
  updateList();
  await renderPage();
  syncPageNav();
  setStatus(
    `Loaded: ${file.name}  •  ${state.totalPages} page${state.totalPages > 1 ? "s" : ""}`,
  );
}

// ── Callbacks from sub-modules ───────────────────────────────────────────────
function onRedactionAdded() {
  updateList();
  syncActionButtons();
}

function onRedactionRemoved() {
  drawRedactions();
  syncActionButtons();
}

// ── Page navigation ───────────────────────────────────────────────────────────
function syncPageNav() {
  pageInfo.textContent = `${state.pageNum} / ${state.totalPages}`;
  prevBtn.disabled = state.pageNum <= 1;
  nextBtn.disabled = state.pageNum >= state.totalPages;
}

function syncActionButtons() {
  const hasAny = state.redactions.length > 0;
  applyBtn.disabled = !hasAny;
  clearBtn.disabled = !hasAny;
}

prevBtn.addEventListener("click", async () => {
  if (state.pageNum > 1) {
    state.pageNum--;
    await renderPage();
    syncPageNav();
  }
});
nextBtn.addEventListener("click", async () => {
  if (state.pageNum < state.totalPages) {
    state.pageNum++;
    await renderPage();
    syncPageNav();
  }
});

// ── Clear all ─────────────────────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  state.redactions = [];
  updateList();
  drawRedactions();
  syncActionButtons();
});

// ── Download ──────────────────────────────────────────────────────────────────
applyBtn.addEventListener("click", async () => {
  applyBtn.disabled = true;
  applyBtn.textContent = "Processing…";
  try {
    await downloadRedacted();
  } finally {
    applyBtn.disabled = state.redactions.length === 0;
    applyBtn.textContent = "Download redacted PDF";
  }
});

// ── File inputs ───────────────────────────────────────────────────────────────
fileInput.addEventListener("change", (e) => loadFile(e.target.files[0]));
dropInput.addEventListener("change", (e) => loadFile(e.target.files[0]));

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("drag-over"),
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  loadFile(e.dataTransfer.files[0]);
});

document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(msg) {
  statusBar.textContent = msg;
}
