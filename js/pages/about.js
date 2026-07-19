import { initApp, setDataStatus, applyMetadata, scheduleBackgroundTask } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.7.5-home-spacing";
import { CONFIG } from "../config.js";

const page = document.body.dataset.page || "";
initApp(page);

let data = getInitialData();
applyMetadata(data.settings);

function renderSummary() {
  const metrics = {
    workspaces: data.workspaces.length,
    groups: data.groups.length,
    folders: data.resources.filter((item) => item.type !== "application").length,
    applications: data.resources.filter((item) => item.type === "application").length
  };
  Object.entries(metrics).forEach(([key, value]) => {
    document.querySelectorAll(`[data-summary-${key}]`).forEach((node) => { node.textContent = String(value); });
  });
  document.querySelectorAll("[data-about-version]").forEach((node) => { node.textContent = CONFIG.appVersion; });
  document.querySelectorAll("[data-about-updated]").forEach((node) => { node.textContent = data.settings.contentUpdatedAt || "19 Juli 2026"; });
}

renderSummary();
setDataStatus("Siap digunakan", "ready");

if (page === "about") {
  scheduleBackgroundTask(async () => {
    setDataStatus("Memeriksa pembaruan…", "loading");
    try {
      const result = await refreshFromSheets();
      if (result.changed) {
        data = result.data;
        applyMetadata(data.settings);
        renderSummary();
      }
      if (result.partialFailure) setDataStatus("Data lokal aktif", "warning", `Sebagian sumber belum dapat dibaca: ${result.failedSheets.join(", ")}.`);
      else if (result.warnings.length) setDataStatus("Data tersedia", "warning", `${result.warnings.length} peringatan data terdeteksi.`);
      else setDataStatus(result.changed ? "Data tersinkron" : "Siap digunakan", result.changed ? "connected" : "ready");
    } catch {
      setDataStatus("Data lokal aktif", "warning", "Google Sheets belum dapat dihubungi.");
    }
  });
}
