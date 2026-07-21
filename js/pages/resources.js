import {
  initApp,
  debounce,
  announce,
  setDataStatus,
  applyMetadata,
  scheduleBackgroundTask,
  minimumSearchLength,
  updateQueryString
} from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.4-deep-search";
import { searchResourcesWithScores } from "../search.js";
import { emptyState, resourceCard } from "../ui.js";

initApp("resources");

let data = getInitialData();
applyMetadata(data.settings);
const searchInput = document.querySelector("[data-resource-search]");
const workspaceFilter = document.querySelector("[data-workspace-filter]");
const typeFilter = document.querySelector("[data-type-filter]");
const yearFilter = document.querySelector("[data-year-filter]");
const sortFilter = document.querySelector("[data-sort-filter]");
const list = document.querySelector("[data-resource-list]");
const emptyContainer = document.querySelector("[data-resource-empty]");
const countNode = document.querySelector("[data-resource-count]");
const filterSummary = document.querySelector("[data-filter-summary]");
const resetButton = document.querySelector("[data-filter-reset]");
const filterForm = document.querySelector("[data-resource-filters]");

function getParams() {
  const params = new URLSearchParams(window.location.search);
  const validSort = ["relevance", "newest", "title", "workspace"];
  return {
    q: params.get("q") || "",
    workspace: params.get("workspace") || "",
    type: ["document", "application"].includes(params.get("type")) ? params.get("type") : "",
    year: /^20\d{2}$/.test(params.get("year") || "") ? params.get("year") : "",
    sort: validSort.includes(params.get("sort")) ? params.get("sort") : ""
  };
}

function setParams({ q, workspace, type, year, sort }) {
  updateQueryString({ q, workspace, type, year, sort: sort === defaultSort(q) ? "" : sort });
}

function defaultSort(query) {
  return query ? "relevance" : "newest";
}


function resourceSortYear(resource) {
  return Number(resource.sortYear || resource.yearEnd || resource.year || 0);
}

function workspaceOptions() {
  const options = data.workspaces.map((workspace) => ({ id: workspace.id, title: workspace.title }));
  if (data.resources.some((resource) => resource.scope === "reference" || resource.workspaceId === "document-center")) {
    options.push({ id: "document-center", title: "Referensi" });
  }
  return options;
}

function resourceIncludesYear(resource, year) {
  const selected = Number(year);
  if (!selected || resource.type === "application") return false;
  const start = Number(resource.yearStart || resource.year || 0);
  const end = Number(resource.yearEnd || resource.year || start || 0);
  return Boolean(start && end && selected >= start && selected <= end);
}


function populateFilters(preserve = true) {
  const currentWorkspace = preserve ? workspaceFilter.value : "";
  const currentYear = preserve ? yearFilter.value : "";

  workspaceFilter.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
  workspaceOptions().forEach((workspace) => {
    const option = document.createElement("option");
    option.value = workspace.id;
    option.textContent = workspace.title;
    workspaceFilter.append(option);
  });

  const years = new Set();
  data.resources.filter((item) => item.type !== "application").forEach((resource) => {
    const start = Number(resource.yearStart || resource.year || 0);
    const end = Number(resource.yearEnd || resource.year || start || 0);
    if (!start || !end || end < start || end - start > 100) return;
    for (let year = start; year <= end; year += 1) years.add(year);
  });

  yearFilter.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
  [...years].sort((a, b) => b - a).forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearFilter.append(option);
  });

  if ([...workspaceFilter.options].some((option) => option.value === currentWorkspace)) workspaceFilter.value = currentWorkspace;
  if ([...yearFilter.options].some((option) => option.value === currentYear)) yearFilter.value = currentYear;
}

function sortResults(items, sort, hasQuery) {
  if (sort === "relevance" && hasQuery) return items;
  return items.slice().sort((a, b) => {
    const left = a.resource;
    const right = b.resource;
    if (sort === "title") return left.title.localeCompare(right.title, "id") || resourceSortYear(right) - resourceSortYear(left);
    if (sort === "workspace") return left.workspaceTitle.localeCompare(right.workspaceTitle, "id") || left.title.localeCompare(right.title, "id");
    if (left.type !== right.type) return left.type === "application" ? 1 : -1;
    return resourceSortYear(right) - resourceSortYear(left)
      || (left.sortOrder || 999) - (right.sortOrder || 999)
      || left.title.localeCompare(right.title, "id");
  });
}

function updateSummary({ q, workspace, type, year, sort }, count) {
  const parts = [];
  if (q) parts.push(`pencarian “${q}”`);
  if (workspace) parts.push(workspaceOptions().find((item) => item.id === workspace)?.title || workspace);
  if (type) parts.push(type === "application" ? "aplikasi" : "folder dokumen");
  if (year) parts.push(`tahun ${year}`);
  const sortLabel = sortFilter.options[sortFilter.selectedIndex]?.textContent || sort;
  filterSummary.textContent = parts.length
    ? `${count} hasil untuk ${parts.join(" • ")} — urutkan: ${sortLabel}`
    : `${count} resource tersedia — urutkan: ${sortLabel}`;
}

function resetFilters() {
  searchInput.value = "";
  workspaceFilter.value = "";
  typeFilter.value = "";
  yearFilter.value = "";
  yearFilter.disabled = false;
  sortFilter.value = "newest";
  render();
  searchInput.focus();
}

function render() {
  const q = searchInput.value.trim();
  const workspace = workspaceFilter.value;
  const type = typeFilter.value;
  const year = yearFilter.value;
  const minimum = minimumSearchLength(data.settings);
  let sort = sortFilter.value || defaultSort(q);

  list.replaceChildren();
  emptyContainer.replaceChildren();

  if (q && q.length < minimum) {
    countNode.textContent = "0";
    filterSummary.textContent = `Ketik minimal ${minimum} karakter untuk mencari.`;
    emptyContainer.append(emptyState(
      `Ketik minimal ${minimum} karakter`,
      "Pencarian pendek tidak dijalankan agar hasil tetap relevan.",
      "search",
      { label: "Hapus pencarian", onClick: resetFilters }
    ));
    setParams({ q, workspace, type, year, sort });
    return;
  }

  const searchableItems = q
    ? [...data.resources, ...(data.searchIndex || [])]
    : data.resources;
  let scored = q
    ? searchResourcesWithScores(searchableItems, q, data.synonyms)
    : searchableItems.map((resource) => ({ resource, score: 0 }));
  if (workspace) scored = scored.filter((item) => item.resource.workspaceId === workspace);
  if (type) scored = scored.filter((item) => item.resource.type === type);
  if (year) scored = scored.filter((item) => resourceIncludesYear(item.resource, year));

  if (!q && sort === "relevance") {
    sort = "newest";
    sortFilter.value = sort;
  }

  const results = sortResults(scored, sort, Boolean(q)).map((item) => item.resource);
  results.forEach((resource) => list.append(resourceCard(resource)));
  if (!results.length) {
    emptyContainer.append(emptyState(
      "Tidak ada resource yang sesuai",
      "Ubah kata pencarian atau hapus salah satu filter.",
      "search",
      { label: "Reset pencarian dan filter", onClick: resetFilters }
    ));
  }

  countNode.textContent = String(results.length);
  updateSummary({ q, workspace, type, year, sort }, results.length);
  setParams({ q, workspace, type, year, sort });
  const directCount = results.filter((item) => item.kind === "deep-folder").length;
  announce(`${results.length} hasil ditemukan, termasuk ${directCount} folder langsung.`);
}

const initial = getParams();
populateFilters(false);
searchInput.value = initial.q;
workspaceFilter.value = initial.workspace;
typeFilter.value = initial.type;
yearFilter.value = initial.year;
yearFilter.disabled = initial.type === "application";
sortFilter.value = initial.sort || defaultSort(initial.q);
render();

searchInput.addEventListener("input", debounce(() => {
  if (!sortFilter.value || sortFilter.value === "newest") sortFilter.value = searchInput.value.trim() ? "relevance" : "newest";
  render();
}));
workspaceFilter.addEventListener("change", render);
typeFilter.addEventListener("change", () => {
  if (typeFilter.value === "application") yearFilter.value = "";
  yearFilter.disabled = typeFilter.value === "application";
  render();
});
yearFilter.addEventListener("change", render);
sortFilter.addEventListener("change", render);
resetButton.addEventListener("click", resetFilters);
filterForm.addEventListener("submit", (event) => { event.preventDefault(); render(); });

window.addEventListener("popstate", () => {
  const state = getParams();
  searchInput.value = state.q;
  workspaceFilter.value = state.workspace;
  typeFilter.value = state.type;
  yearFilter.value = state.year;
  yearFilter.disabled = state.type === "application";
  sortFilter.value = state.sort || defaultSort(state.q);
  render();
});

setDataStatus("Siap digunakan", "ready");
scheduleBackgroundTask(async () => {
  setDataStatus("Memeriksa pembaruan…", "loading");
  try {
    const result = await refreshFromSheets();
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      populateFilters(true);
      render();
    }
    if (result.partialFailure) setDataStatus("Data lokal aktif", "warning", `Sebagian sumber belum dapat dibaca: ${result.failedSheets.join(", ")}.`);
    else if (result.warnings.length) setDataStatus("Data tersedia", "warning", `${result.warnings.length} peringatan data terdeteksi.`);
    else setDataStatus(result.changed ? "Data tersinkron" : "Siap digunakan", result.changed ? "connected" : "ready");
  } catch {
    setDataStatus("Data lokal aktif", "warning", "Google Sheets belum dapat dihubungi.");
  }
});
