import { initApp, setDataStatus, applyMetadata, scheduleBackgroundTask } from "../app.js";
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
      detailNode.hidden = true;
      listNode.hidden = false;
      listNode.append(emptyState("Informasi tidak ditemukan", "Informasi yang dipilih tidak tersedia.", "alert", { label: "Kembali ke daftar informasi", href: "information.html" }));
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
setDataStatus("Siap digunakan", "ready");

scheduleBackgroundTask(async () => {
  setDataStatus("Memeriksa pembaruan…", "loading");
  try {
    const result = await refreshFromSheets();
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      render();
    }
    if (result.partialFailure) setDataStatus("Data lokal aktif", "warning", `Sebagian sumber belum dapat dibaca: ${result.failedSheets.join(", ")}.`);
    else if (result.warnings.length) setDataStatus("Data tersedia", "warning", `${result.warnings.length} peringatan data terdeteksi.`);
    else setDataStatus(result.changed ? "Data tersinkron" : "Siap digunakan", result.changed ? "connected" : "ready");
  } catch {
    setDataStatus("Data lokal aktif", "warning", "Google Sheets belum dapat dihubungi.");
  }
});
