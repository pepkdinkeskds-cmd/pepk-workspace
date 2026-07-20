import {
  initApp,
  debounce,
  announce,
  setDataStatus,
  applyMetadata,
  scheduleBackgroundTask,
  minimumSearchLength,
  createElement,
  externalLink
} from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.3-reference-workspace";
import { searchResources } from "../search.js";
import { agendaCard, applicationCard, emptyState, realizationCard, resourceCard, workspaceCard } from "../ui.js?v=0.9.3-reference-workspace";
import { latestRealization, upcomingAgenda } from "../information-utils.js";
import { icon } from "../icons.js";

initApp("home");

let data = getInitialData();
applyMetadata(data.settings);
let currentQuery = "";

const searchInput = document.querySelector("[data-home-search]");
const searchForm = document.querySelector("[data-home-search-form]");
const resultsSection = document.querySelector("[data-home-results-section]");
const resultsGrid = document.querySelector("[data-home-results]");
const emptyContainer = document.querySelector("[data-home-empty]");
const resultsTitle = document.querySelector("[data-home-results-title]");
const viewAllLink = document.querySelector("[data-view-all-results]");

function quickResources() {
  const resourceMap = new Map(data.resources.map((item) => [item.id, item]));
  return data.quickAccess.map((id) => resourceMap.get(id)).filter(Boolean);
}

function renderQuickAccess() {
  const folderContainer = document.querySelector("[data-quick-folders]");
  const appContainer = document.querySelector("[data-quick-apps]");
  folderContainer.replaceChildren();
  appContainer.replaceChildren();

  const items = quickResources();
  const folders = items.filter((item) => item.type !== "application").slice(0, data.settings.quickFolderLimit || 4);
  const applications = items.filter((item) => item.type === "application").slice(0, data.settings.quickAppLimit || 4);

  folders.forEach((resource) => folderContainer.append(resourceCard(resource, { compact: true })));
  applications.forEach((resource) => appContainer.append(applicationCard(resource, { compact: true })));

  if (!folders.length) folderContainer.append(emptyState("Belum ada folder cepat", "Pilih folder melalui halaman Pustaka.", "folder", { label: "Buka Pustaka", href: "resources.html?type=document" }));
  if (!applications.length) appContainer.append(emptyState("Belum ada aplikasi cepat", "Semua aplikasi tetap tersedia di Pustaka.", "apps", { label: "Lihat aplikasi", href: "resources.html?type=application" }));
}


function contributionAction({ title, description, iconName, url, fallbackHref }) {
  const article = createElement("article", { className: "contribution-quick-card" });
  article.append(
    createElement("span", { className: "contribution-quick-card__icon", html: icon(iconName) }),
    createElement("div", { className: "contribution-quick-card__content" }, [
      createElement("h3", { text: title }),
      createElement("p", { text: description })
    ])
  );
  if (url) {
    const link = externalLink(url, title, "button button--secondary contribution-quick-card__action");
    link.innerHTML = `${icon(iconName)} Buka formulir`;
    article.append(link);
  } else {
    article.append(createElement("a", { className: "button button--secondary contribution-quick-card__action", href: fallbackHref, html: `${icon("arrow")} Lihat cara penggunaan` }));
  }
  return article;
}

function renderContributionActions() {
  const container = document.querySelector("[data-contribution-actions]");
  if (!container) return;
  container.replaceChildren(
    contributionAction({
      title: "Unggah Dokumen",
      description: "Kirim file tanpa akses Editor. Dokumen masuk ke antrean pemeriksaan administrator.",
      iconName: "upload",
      url: data.settings.workflowEnabled !== false ? data.settings.documentUploadFormUrl : "",
      fallbackHref: "contribute.html"
    }),
    contributionAction({
      title: "Tambah Agenda",
      description: "Kirim jadwal rapat atau kegiatan untuk diperiksa sebelum tampil di Pusat Informasi.",
      iconName: "send",
      url: data.settings.workflowEnabled !== false ? data.settings.agendaSubmitFormUrl : "",
      fallbackHref: "contribute.html"
    })
  );
}

function renderWorkspaces() {
  const container = document.querySelector("[data-workspaces]");
  container.replaceChildren();
  data.workspaces.forEach((workspace) => {
    const workspaceResources = data.resources.filter((resource) => resource.workspaceId === workspace.id);
    const counts = {
      groups: data.groups.filter((group) => group.workspaceId === workspace.id).length,
      documents: workspaceResources.filter((resource) => resource.type !== "application").length,
      applications: workspaceResources.filter((resource) => resource.type === "application").length
    };
    container.append(workspaceCard(workspace, counts));
  });
}

function renderAgenda() {
  const container = document.querySelector("[data-agenda-preview]");
  if (!container) return;
  container.replaceChildren();
  const items = upcomingAgenda(data.agenda).slice(0, data.settings.agendaHomeLimit || 3);
  items.forEach((item) => container.append(agendaCard(item, { compact: true })));
  if (!items.length) {
    container.append(emptyState("Belum ada agenda aktif", "Agenda rapat dan kegiatan akan tampil setelah diisi melalui sheet Agenda.", "calendar", { label: "Buka Pusat Informasi", href: "information.html#agenda" }));
  }
}

function renderRealization() {
  const container = document.querySelector("[data-realization-preview]");
  if (!container) return;
  container.replaceChildren();
  const item = latestRealization(data.realization);
  if (item) container.append(realizationCard(item, {
    compact: true,
    balancedThreshold: data.settings.deviationBalancedThreshold || 2,
    attentionThreshold: data.settings.deviationAttentionThreshold || 5
  }));
  if (!item) {
    container.append(emptyState("Data capaian belum tersedia", "Capaian realisasi akan tampil setelah indikator diisi melalui sheet Realization.", "trend", { label: "Buka Pusat Informasi", href: "information.html#realisasi" }));
  }
}

function clearHomeSearch() {
  currentQuery = "";
  searchInput.value = "";
  resultsSection.hidden = true;
  resultsGrid.replaceChildren();
  emptyContainer.replaceChildren();
  searchInput.focus();
}

function renderSearch(query) {
  currentQuery = query.trim();
  resultsGrid.replaceChildren();
  emptyContainer.replaceChildren();

  if (!currentQuery) {
    resultsSection.hidden = true;
    viewAllLink.hidden = true;
    return;
  }

  const minimum = minimumSearchLength(data.settings);
  resultsSection.hidden = false;
  viewAllLink.href = `resources.html?q=${encodeURIComponent(currentQuery)}`;
  viewAllLink.hidden = false;

  if (currentQuery.length < minimum) {
    viewAllLink.hidden = true;
    resultsTitle.textContent = "Pencarian belum dijalankan";
    emptyContainer.append(emptyState(
      `Ketik minimal ${minimum} karakter`,
      "Gunakan nama dokumen, aplikasi, tahun, atau kebutuhan pekerjaan.",
      "search",
      { label: "Hapus pencarian", onClick: clearHomeSearch }
    ));
    announce(`Ketik minimal ${minimum} karakter untuk mencari.`);
    return;
  }

  const results = searchResources(data.resources, currentQuery, data.synonyms);
  const folderCount = results.filter((item) => item.type !== "application").length;
  const appCount = results.length - folderCount;
  resultsTitle.textContent = `${results.length} hasil untuk “${currentQuery}”`;

  if (!results.length) {
    viewAllLink.hidden = true;
    emptyContainer.append(emptyState(
      "Resource belum ditemukan",
      "Coba nama dokumen, aplikasi, tahun, atau istilah lain yang lebih umum.",
      "search",
      { label: "Hapus pencarian", onClick: clearHomeSearch }
    ));
  } else {
    results.slice(0, data.settings.homeResultLimit || 6).forEach((resource) => resultsGrid.append(resourceCard(resource)));
    announce(`${results.length} hasil ditemukan: ${folderCount} folder dan ${appCount} aplikasi.`);
  }
}

const debouncedSearch = debounce(() => renderSearch(searchInput.value));
searchInput.addEventListener("input", debouncedSearch);
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query.length >= minimumSearchLength(data.settings)) window.location.href = `resources.html?q=${encodeURIComponent(query)}`;
  else renderSearch(query);
});

document.querySelectorAll("[data-search-suggestion]").forEach((button) => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.searchSuggestion;
    renderSearch(searchInput.value);
    searchInput.focus();
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function renderAll() {
  renderQuickAccess();
  renderContributionActions();
  renderWorkspaces();
  renderAgenda();
  renderRealization();
  if (currentQuery) renderSearch(currentQuery);
}

renderAll();
setDataStatus("Siap digunakan", "ready", "Data lokal tersedia tanpa menunggu koneksi Google Sheets.");

scheduleBackgroundTask(async () => {
  setDataStatus("Memeriksa pembaruan…", "loading");
  try {
    const result = await refreshFromSheets();
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      renderAll();
    }
    if (result.partialFailure) {
      setDataStatus("Data lokal aktif", "warning", `Sebagian sumber belum dapat dibaca: ${result.failedSheets.join(", ")}.`);
    } else if (result.warnings.length) {
      setDataStatus("Data tersedia", "warning", `${result.warnings.length} peringatan data terdeteksi.`);
    } else {
      setDataStatus(result.changed ? "Data tersinkron" : "Siap digunakan", result.changed ? "connected" : "ready");
    }
  } catch {
    setDataStatus("Data lokal aktif", "warning", "Google Sheets belum dapat dihubungi. Workspace tetap menggunakan data bawaan.");
  }
});
