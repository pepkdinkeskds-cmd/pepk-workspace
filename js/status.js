import { setDataStatus } from "./app.js?v=0.9.7-rc3";
import { sourceDescription } from "./data/data-service.js?v=0.9.7-rc3";

export function renderProvenance(data) {
  if (!data) return;
  document.querySelectorAll("[data-source]").forEach((node) => {
    const section = node.dataset.source;
    const meta = data._meta?.[section];
    const warnings = meta?.warnings || [];
    node.textContent = `${sourceDescription(data, section)}${warnings.length ? ` ${warnings.join(" ")}` : ""}`;
    node.dataset.state = meta?.failed || warnings.length ? "warning" : "ready";
  });
}

function applyStatus(message, state = "ready", detail = "") {
  document.documentElement.dataset.pageReady = "true";
  document.dispatchEvent(new Event("pepk:ready"));
  document.querySelectorAll("[data-data-status]").forEach((node) => {
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    node.setAttribute("aria-atomic", "true");
  });
  setDataStatus(message, state, detail);
}

export function setContentStatus(message, state = "ready", detail = "") {
  applyStatus(message, state, detail);
}

export function setContentReady(data) {
  renderProvenance(data);
  applyStatus("Katalog tersedia; sumber belum diperiksa", "warning");
}

export function setContentRefreshing() {
  applyStatus("Memeriksa sumber…", "loading");
}

export function setContentRefreshResult(result = {}) {
  renderProvenance(result.data);
  if (result.partialFailure) {
    applyStatus(
      "Sebagian sumber belum tersinkron",
      "warning",
      "Sebagian pembaruan belum tersedia. Konten yang telah tersimpan tetap dapat digunakan."
    );
    return;
  }

  if (result.warnings?.length) {
    applyStatus(
      "Sumber terbaca; ada data perlu diperiksa",
      "warning",
      "Sebagian data memerlukan pemeriksaan operator."
    );
    return;
  }

  applyStatus(
    "Sumber terbaca",
    "connected",
    "Waktu sinkronisasi bukan periode pelaporan. Periksa periode pada masing-masing data."
  );
}

export function setContentRefreshUnavailable() {
  applyStatus(
    "Sumber belum tersinkron",
    "warning",
    "Pembaruan belum tersedia. Konten yang telah tersimpan tetap dapat digunakan."
  );
}
