import { initApp, debounce, announce, setDataStatus, applyMetadata } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js";
import { searchResources } from "../search.js";
import { applicationCard, emptyState, informationCard, resourceCard, workspaceCard } from "../ui.js";

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
  items.filter((item) => item.type !== "application").slice(0, 8).forEach((resource) => {
    folderContainer.append(resourceCard(resource, { compact: true }));
  });
  items.filter((item) => item.type === "application").slice(0, 8).forEach((resource) => {
    appContainer.append(applicationCard(resource, { compact: true }));
  });
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

function renderInformation() {
  const container = document.querySelector("[data-information-preview]");
  container.replaceChildren();
  data.information.slice(0, 3).forEach((item) => container.append(informationCard(item)));
}

function renderSearch(query) {
  currentQuery = query.trim();
  resultsGrid.replaceChildren();
  emptyContainer.replaceChildren();

  if (!currentQuery) {
    resultsSection.hidden = true;
    return;
  }

  const results = searchResources(data.resources, currentQuery, data.synonyms);
  resultsSection.hidden = false;
  resultsTitle.textContent = `${results.length} resource cocok dengan “${currentQuery}”`;
  viewAllLink.href = `resources.html?q=${encodeURIComponent(currentQuery)}`;

  if (!results.length) {
    emptyContainer.append(emptyState("Resource belum ditemukan", "Coba gunakan nama dokumen, aplikasi, tahun, atau kebutuhan pekerjaan."));
  } else {
    results.slice(0, data.settings.homeResultLimit || 6).forEach((resource) => resultsGrid.append(resourceCard(resource)));
  }

  announce(`${results.length} hasil pencarian ditemukan.`);
}

const debouncedSearch = debounce(() => renderSearch(searchInput.value));
searchInput.addEventListener("input", debouncedSearch);
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) window.location.href = `resources.html?q=${encodeURIComponent(query)}`;
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
  renderWorkspaces();
  renderInformation();
  if (currentQuery) renderSearch(currentQuery);
}

renderAll();
setDataStatus("Data lokal siap", "ready");

setDataStatus("Menyinkronkan Google Sheets…", "loading");
refreshFromSheets()
  .then((result) => {
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      renderAll();
      setDataStatus("Terhubung ke Google Sheets", "connected");
    } else {
      setDataStatus("Data lokal siap", "ready");
    }
  })
  .catch(() => setDataStatus("Data lokal aktif", "warning"));
