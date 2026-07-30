import { initApp, applyMetadata, scheduleBackgroundTask } from "../app.js";
import {
  setContentReady,
  setContentRefreshing,
  setContentRefreshResult,
  setContentRefreshUnavailable
} from "../status.js?v=0.9.5-quality-06";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.5-intent-search";
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
setContentReady();

if (page === "about") {
  scheduleBackgroundTask(async () => {
    setContentRefreshing();
    try {
      const result = await refreshFromSheets();
      if (result.changed) {
        data = result.data;
        applyMetadata(data.settings);
        renderSummary();
      }
      setContentRefreshResult(result);
    } catch {
      setContentRefreshUnavailable();
    }
  });
}
