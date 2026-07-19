import { initApp, setDataStatus, applyMetadata, scheduleBackgroundTask } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.7.1-workflow-settings-1";
import { agendaCard, informationCard, realizationCard, realizationChart, realizationTable, emptyState } from "../ui.js";
import { latestRealization, realizationForYear, realizationYears, upcomingAgenda } from "../information-utils.js";
import { icon } from "../icons.js";

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
  const url = data.settings.workflowEnabled !== false ? data.settings.agendaSubmitFormUrl : "";
  if (url) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.hidden = false;
  } else {
    link.href = "contribute.html";
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.hidden = false;
  }
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
      "Rapat internal, undangan eksternal, lokasi, dan PIC akan tampil di bagian ini setelah sheet Agenda diisi.",
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
      "Tambahkan satu baris untuk setiap bulan pada sheet Realization. Deviasi akan dihitung otomatis dari capaian fisik dikurangi realisasi keuangan.",
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
