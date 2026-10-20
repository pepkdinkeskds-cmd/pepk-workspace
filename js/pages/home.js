import { initApp, applyMetadata, scheduleBackgroundTask, createElement, minimumSearchLength } from "../app.js?v=0.9.7-rc3";
import { setContentReady, setContentRefreshing, setContentRefreshResult, setContentRefreshUnavailable } from "../status.js?v=0.9.7-rc3";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.7-rc3";
import { agendaCard, applicationCard, emptyState, realizationOverviewCard, resourceCard, workspaceCard } from "../ui.js?v=0.9.7-rc3";
import { latestRealization, upcomingAgenda } from "../information-utils.js?v=0.9.7-rc3";
import { configureSubmissionLink } from "./submission-portal-bridge.js?v=0.9.7-rc3";

initApp("home");
let data = getInitialData();
const input = document.querySelector("[data-home-search]");
document.querySelector("[data-home-search-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  if (input.value.trim().length < minimumSearchLength(data.settings)) {
    input.setCustomValidity(`Ketik minimal ${minimumSearchLength(data.settings)} karakter.`);
    input.reportValidity();
    return;
  }
  window.location.href = `resources.html?q=${encodeURIComponent(input.value.trim())}`;
});
input.addEventListener("input", () => input.setCustomValidity(""));
document.querySelectorAll("[data-search-suggestion]").forEach((button) => button.addEventListener("click", () => {
  window.location.href = `resources.html?q=${encodeURIComponent(button.dataset.searchSuggestion)}`;
}));

function render() {
  applyMetadata(data.settings, data);
  const byId = new Map(data.resources.map((r) => [r.id, r]));
  const quick = data.quickAccess.map((id) => byId.get(id)).filter(Boolean);
  for (const [selector, application] of [["[data-quick-folders]", false], ["[data-quick-apps]", true]]) {
    const container = document.querySelector(selector);
    const items = quick.filter((r) => (r.type === "application") === application).slice(0, 4);
    container.replaceChildren(...items.map((r) => application ? applicationCard(r, { compact: true }) : resourceCard(r, { compact: true })));
    if (!items.length) container.append(emptyState("Akses utama belum tersedia", "Telusuri katalog melalui Pustaka.", "folder", { label: "Buka Pustaka", href: "resources.html" }));
  }
  const actions = document.querySelector("[data-contribution-actions]");
  const link = createElement("a", { className: "button button--primary", text: "Mulai pengajuan" });
  configureSubmissionLink(link, "Mulai pengajuan PEPK");
  actions.replaceChildren(link, createElement("a", { className: "text-link", href: "contribute.html", text: "Lihat alur layanan →" }));
  document.querySelector("[data-workspaces]").replaceChildren(...data.workspaces.map((w) => workspaceCard(w, {
    groups: data.groups.filter((r) => r.workspaceId === w.id).length,
    documents: data.resources.filter((r) => r.workspaceId === w.id && r.type !== "application").length,
    applications: data.resources.filter((r) => r.workspaceId === w.id && r.type === "application").length
  })));
  const agendas = upcomingAgenda(data.agenda).slice(0, 3);
  document.querySelector("[data-agenda-preview]").replaceChildren(...(agendas.length ? agendas.map((r) => agendaCard(r, { compact: true })) : [emptyState("Belum ada agenda aktif", "Agenda tampil setelah dipublikasikan operator.", "calendar", { label: "Buka informasi", href: "information.html#agenda" })]));
  const latest = latestRealization(data.realization);
  document.querySelector("[data-realization-preview]").replaceChildren(latest ? realizationOverviewCard(data.realization, {
    balancedThreshold: data.settings.deviationBalancedThreshold ?? 2,
    attentionThreshold: data.settings.deviationAttentionThreshold ?? 5
  }) : emptyState("Data capaian belum tersedia", "Data realisasi yang layak ditampilkan belum tersedia dari sumber. Angka contoh tidak ditampilkan.", "trend", { label: "Buka rincian", href: "information.html#realisasi" }));
}

render();
setContentReady(data);
scheduleBackgroundTask(async () => {
  setContentRefreshing();
  try {
    const result = await refreshFromSheets();
    data = result.data;
    render();
    setContentRefreshResult(result);
  } catch { setContentRefreshUnavailable(); }
});
