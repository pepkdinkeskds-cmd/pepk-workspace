/* Footer controls remain usable independently of catalog loading. */
(() => {
  function initialize() {
    const button = document.querySelector("[data-footer-status]");
    const dialog = document.querySelector("[data-source-dialog]");
    if (!button || !dialog || button.dataset.ready === "true") return;
    button.dataset.ready = "true";
    const label = button.querySelector("[data-footer-status-label]");
    const overview = dialog.querySelector("[data-source-overview]");
    const rows = dialog.querySelector("[data-source-rows]");
    const close = dialog.querySelector("[data-source-close]");
    function closeDialog() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      button.focus({preventScroll: true});
    }
    button.addEventListener("click", () => {
      document.querySelector(".feedback-panel:not([hidden]) .feedback-panel__close")?.click();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else {dialog.setAttribute("open", ""); dialog.setAttribute("aria-modal", "true");}
      close.focus({preventScroll: true});
    });
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", (event) => {event.preventDefault(); closeDialog();});
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {event.preventDefault(); closeDialog();}
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
    });
    document.addEventListener("pepk:data-status", (event) => {
      const {state, message, description} = event.detail;
      button.dataset.state = state;
      label.textContent = state === "loading" ? "Memeriksa…" : state === "connected" ? "Sumber terbaca"
        : /perlu diperiksa|memerlukan pemeriksaan/.test(message) ? "Perlu diperiksa"
        : /belum tersinkron/.test(message) ? "Belum tersinkron" : "Data tersimpan";
      button.setAttribute("aria-label", `Lihat status sumber data: ${message}`);
      button.title = message;
      overview.textContent = description ? `${message}. ${description}` : message;
    });
    document.addEventListener("pepk:source-health", (event) => {
      rows.replaceChildren(...event.detail.map((item) => {
        const card = document.createElement("article"); card.className = "source-dialog__source"; card.dataset.state = item.tone;
        const title = document.createElement("h3"); title.textContent = item.label;
        const status = document.createElement("strong"); status.className = "source-dialog__badge"; status.textContent = item.status;
        const text = document.createElement("p"); text.textContent = item.description;
        const detail = document.createElement("p"); detail.className = "source-dialog__source-meta";
        detail.textContent = `${item.count === null ? "" : `${item.count} entri · `}${item.period ? `Periode ${item.period} · ` : ""}Dibaca: ${item.checked}`;
        card.append(title, status, text, detail); return card;
      }));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, {once: true});
  else initialize();
})();
