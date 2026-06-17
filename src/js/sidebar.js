import { state } from "./state.js";

const listEl = document.getElementById("redaction-list");
const emptyHint = document.getElementById("empty-hint");

/**
 * initSidebar({ onRedactionRemoved })
 * Renders the redaction list in the sidebar.
 * Returns { updateList } for app.js to call after state changes.
 */
export function initSidebar({ onRedactionRemoved }) {
  function updateList() {
    listEl.innerHTML = "";

    if (state.redactions.length === 0) {
      listEl.appendChild(emptyHint);
      return;
    }

    state.redactions.forEach((r, i) => {
      const item = document.createElement("div");
      item.className = "redaction-item";

      const swatch = document.createElement("div");
      swatch.className = "ri-swatch";
      swatch.style.background = r.color;

      const label = document.createElement("span");
      label.className = "ri-label";
      label.textContent = `Page ${r.page}`;

      const del = document.createElement("button");
      del.className = "ri-del";
      del.textContent = "×";
      del.title = "Remove";
      del.addEventListener("click", () => {
        state.redactions.splice(i, 1);
        updateList();
        onRedactionRemoved();
      });

      item.append(swatch, label, del);
      listEl.appendChild(item);
    });
  }

  return { updateList };
}
