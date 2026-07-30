import { initApp, applyMetadata, scheduleBackgroundTask } from "../app.js";
import {
  setContentReady,
  setContentRefreshing,
  setContentRefreshResult,
  setContentRefreshUnavailable
} from "../status.js?v=0.9.5-quality-04";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.5-intent-search";
import { agendaCard, informationCard, realizationCard, realizationChart, realizationTable, emptyState } from "../ui.js";
import { latestRealization, realizationForYear, realizationYears, upcomingAgenda } from "../information-utils.js";
import { icon } from "../icons.js";
import { SUBMISSION_PORTAL_URL } from "./submission-portal-bridge.js";

initApp("information");

let data = getInitialData();
applyMetadata(data.settings);

const dashboardNode = document.querySelector("[data-information-dashboard]");
const agendaNode = document.querySelector("[data-agenda-list]");
const realizationNode = document.querySelector("[data-realization-list]");
const realizationYearSelect = document.querySelector("[data-realization-year]");
const listNode = document.querySelector("[data-information-list]");
const detailNode = document.querySelector("[data-information-detail]");
const params = new URLSearchParams(window.location.search);
const selectedId = params.get("id");
let selectedRealizationYear = Number(params.get("year")) || null;


function renderAgendaSubmitLink() {
  const link = document.querySelector("[data-agenda-submit-link]");
  if (!link) return;
  link.href = SUBMISSION_PORTAL_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.referrerPolicy = "no-referrer";
  link.setAttribute("aria-label", "Ajukan Agenda melalui Portal Pengajuan PEPK di tab baru");
  link.hidden = false;
}

function renderOverview() {
  dashboardNode.hidden = false;
  detailNode.hidden = true;
  agendaNode.replaceChildren();
  realizationNode.replaceChildren();
  listNode.replaceChildren();

  const agendas = upcomingAgenda(data.agenda);
  agendas.forEach((item) => agendaNode.append(agendaCard(item)));
  if (!agendas.length) {
    agendaNode.append(emptyState(
      "Belum ada agenda aktif",
      "Belum ada agenda aktif yang dipublikasikan.",
      "calendar"
    ));
  }

  const years = realizationYears(data.realization);
  if (!selectedRealizationYear || !years.includes(selectedRealizationYear)) selectedRealizationYear = years[0] || null;
  realizationYearSelect.replaceChildren();
  years.forEach((year) => realizationYearSelect.append(new Option(String(year), String(year), year === selectedRealizationYear, year === selectedRealizationYear)));
  realizationYearSelect.disabled = !years.length;

  const yearItems = selectedRealizationYear ? realizationForYear(data.realization, selectedRealizationYear) : [];
  const latest = latestRealization(yearItems);
  if (latest) {
    realizationNode.append(
      realizationCard(latest, {
        balancedThreshold: data.settings.deviationBalancedThreshold || 2,
        attentionThreshold: data.settings.deviationAttentionThreshold || 5
      }),
      realizationChart(yearItems, selectedRealizationYear),
      realizationTable(
        yearItems,
        selectedRealizationYear,
        data.settings.deviationBalancedThreshold || 2,
        data.settings.deviationAttentionThreshold || 5
      )
    );
  } else {
    realizationNode.append(emptyState(
      "Data capaian belum tersedia",
      "Data realisasi keuangan dan fisik belum dipublikasikan untuk periode ini.",
      "trend"
    ));
  }

  data.information.forEach((item) => listNode.append(informationCard(item)));
  renderAgendaSubmitLink();
}

function renderDetail() {
  const item = data.information.find((entry) => entry.id === selectedId);
  if (!item) {
    dashboardNode.hidden = false;
    detailNode.hidden = true;
    listNode.replaceChildren(emptyState(
      "Informasi tidak ditemukan",
      "Informasi yang dipilih tidak tersedia.",
      "alert",
      { label: "Kembali ke Pusat Informasi", href: "information.html" }
    ));
    return;
  }

  dashboardNode.hidden = true;
  detailNode.hidden = false;
  detailNode.querySelector("[data-information-title]").textContent = item.title;
  detailNode.querySelector("[data-information-summary]").textContent = item.summary;
  detailNode.querySelector("[data-information-content]").textContent = item.content;
  detailNode.querySelector("[data-information-detail-icon]").innerHTML = icon(item.icon || "info");
  document.querySelector("[data-information-heading]").textContent = item.title;
  document.querySelector("[data-information-intro]").textContent = item.summary;
  document.title = `${item.title} — PEPK Workspace`;
}

function render() {
  if (selectedId) renderDetail();
  else renderOverview();
}


realizationYearSelect?.addEventListener("change", () => {
  selectedRealizationYear = Number(realizationYearSelect.value);
  const url = new URL(window.location.href);
  url.searchParams.set("year", String(selectedRealizationYear));
  history.replaceState({}, "", url);
  renderOverview();
  document.querySelector("#realisasi")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

render();
setContentReady();

scheduleBackgroundTask(async () => {
  setContentRefreshing();
  try {
    const result = await refreshFromSheets();
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      render();
    }
    setContentRefreshResult(result);
  } catch {
    setContentRefreshUnavailable();
  }
});
