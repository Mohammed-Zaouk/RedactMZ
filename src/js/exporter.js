/* global PDFLib */
import { state } from "./state.js";

const toast = document.getElementById("toast");
const EXPORT_SCALE = 3;

export async function downloadRedacted() {
  if (!state.pdfBytes || state.redactions.length === 0) return;

  const { PDFDocument } = PDFLib;
  const outDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= state.totalPages; pageNum++) {
    const page = await state.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: EXPORT_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    state.redactions
      .filter((r) => r.page === pageNum)
      .forEach((r) => {
        const [cx, cy] = viewport.convertToViewportPoint(r.x, r.y + r.h);
        const [cx2, cy2] = viewport.convertToViewportPoint(r.x + r.w, r.y);
        ctx.fillStyle = r.color;
        ctx.fillRect(cx, cy, cx2 - cx, cy2 - cy);
      });

    const imgBytes = await fetch(canvas.toDataURL("image/jpeg", 0.92)).then(
      (res) => res.arrayBuffer(),
    );
    const img = await outDoc.embedJpg(imgBytes);
    const ptViewport = page.getViewport({ scale: 1 });
    const outPage = outDoc.addPage([ptViewport.width, ptViewport.height]);
    outPage.drawImage(img, {
      x: 0,
      y: 0,
      width: ptViewport.width,
      height: ptViewport.height,
    });
  }

  const outBytes = await outDoc.save();

  const suggestedName = state.fileName
    ? state.fileName.replace(/\.pdf$/i, "") + "-redacted.pdf"
    : "redacted.pdf";

  await promptAndDownload(outBytes, suggestedName);
}

async function promptAndDownload(bytes, suggestedName) {
  const blob = new Blob([bytes], { type: "application/pdf" });

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: "PDF Document",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      showToast("PDF downloaded!");
    } catch (e) {
      if (e.name !== "AbortError") showToast("Save failed.");
    }
  } else {
    // Fallback for Firefox / Safari
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: suggestedName,
    });
    a.click();
    URL.revokeObjectURL(url);
    showToast("PDF downloaded!");
  }
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
