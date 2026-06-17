import { state } from "./state.js";

const swatches = document.querySelectorAll(".swatch:not(.custom)");
const customSwatch = document.getElementById("custom-swatch");
const customColor = document.getElementById("custom-color");

/**
 * initColorPicker()
 * Wires up the preset swatches and the custom color input.
 * Writes the chosen color into state.currentColor.
 */
export function initColorPicker() {
  // ── Preset swatches ───────────────────────────────────────────────────────
  swatches.forEach((sw) => {
    sw.addEventListener("click", () => {
      setActive(sw);
      state.currentColor = sw.dataset.color;
    });
  });

  // ── Custom color input ────────────────────────────────────────────────────
  customSwatch.addEventListener("click", () => customColor.click());
  customColor.addEventListener("input", () => {
    state.currentColor = customColor.value;
    customSwatch.style.background = customColor.value;
    setActive(customSwatch);
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function setActive(el) {
  document
    .querySelectorAll(".swatch")
    .forEach((s) => s.classList.remove("active"));
  el.classList.add("active");
}
