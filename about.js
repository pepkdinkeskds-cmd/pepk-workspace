import { initApp, applyMetadata, scheduleBackgroundTask } from "../app.js?v=0.9.7-rc2";
import {
  setContentReady,
  setContentRefreshing,
  setContentRefreshResult,
  setContentRefreshUnavailable
} from "../status.js?v=0.9.7-rc2";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.7-rc2";
import { CONFIG } from "../config.js?v=0.9.7-rc2";

const page = document.body.dataset.page || "";
initApp(page);

let data = getInitialData();
applyMetadata(data.settings, data);

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
  applyMetadata(data.settings, data);
}

renderSummary();
setContentReady(data);

if (page === "about") {
  scheduleBackgroundTask(async () => {
    setContentRefreshing();
    try {
      const result = await refreshFromSheets();
      if (result.changed) {
        data = result.data;
        applyMetadata(data.settings, data);
        renderSummary();
      }
      setContentRefreshResult(result);
    } catch {
      setContentRefreshUnavailable();
    }
  });
}
