import { setDataStatus } from "./app.js";

function applyStatus(message, state = "ready", detail = "") {
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

export function setContentReady() {
  applyStatus("Siap digunakan", "ready");
}

export function setContentRefreshing() {
  applyStatus("Memperbarui konten…", "loading");
}

export function setContentRefreshResult(result = {}) {
  if (result.partialFailure) {
    applyStatus(
      "Konten tersimpan aktif",
      "warning",
      "Sebagian pembaruan belum tersedia. Konten yang telah tersimpan tetap dapat digunakan."
    );
    return;
  }

  if (result.warnings?.length) {
    applyStatus(
      "Konten tersedia",
      "warning",
      "Sebagian data memerlukan pemeriksaan operator."
    );
    return;
  }

  applyStatus(
    result.changed ? "Konten terbaru" : "Siap digunakan",
    result.changed ? "connected" : "ready"
  );
}

export function setContentRefreshUnavailable() {
  applyStatus(
    "Konten tersimpan aktif",
    "warning",
    "Pembaruan belum tersedia. Konten yang telah tersimpan tetap dapat digunakan."
  );
}
