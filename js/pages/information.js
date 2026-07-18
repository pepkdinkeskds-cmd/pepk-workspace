import { initApp, setDataStatus, applyMetadata } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js";
import { informationCard, emptyState } from "../ui.js";
import { icon } from "../icons.js";

initApp("information");

let data = getInitialData();
applyMetadata(data.settings);
const listNode = document.querySelector("[data-information-list]");
const detailNode = document.querySelector("[data-information-detail]");
const params = new URLSearchParams(window.location.search);
const selectedId = params.get("id");

function render() {
  listNode.replaceChildren();
  if (selectedId) {
    const item = data.information.find((entry) => entry.id === selectedId);
    if (!item) {
      listNode.append(emptyState("Informasi tidak ditemukan", "Informasi yang dipilih tidak tersedia.", "alert"));
      return;
    }
    listNode.hidden = true;
    detailNode.hidden = false;
    detailNode.querySelector("[data-information-title]").textContent = item.title;
    detailNode.querySelector("[data-information-summary]").textContent = item.summary;
    detailNode.querySelector("[data-information-content]").textContent = item.content;
    detailNode.querySelector("[data-information-detail-icon]").innerHTML = icon(item.icon || "info");
    document.querySelector("[data-information-heading]").textContent = item.title;
    document.querySelector("[data-information-intro]").textContent = item.summary;
    document.title = `${item.title} — PEPK Workspace`;
  } else {
    detailNode.hidden = true;
    listNode.hidden = false;
    data.information.forEach((item) => listNode.append(informationCard(item)));
  }
}

render();

setDataStatus("Menyinkronkan Google Sheets…", "loading");
refreshFromSheets()
  .then((result) => {
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      render();
      setDataStatus("Terhubung ke Google Sheets", "connected");
    } else {
      setDataStatus("Data lokal siap", "ready");
    }
  })
  .catch(() => setDataStatus("Data lokal aktif", "warning"));
