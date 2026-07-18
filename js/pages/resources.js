import { initApp, debounce, announce, setDataStatus, applyMetadata } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js";
import { searchResources } from "../search.js";
import { emptyState, resourceCard } from "../ui.js";

initApp("resources");

let data = getInitialData();
applyMetadata(data.settings);
const searchInput = document.querySelector("[data-resource-search]");
const workspaceFilter = document.querySelector("[data-workspace-filter]");
const yearFilter = document.querySelector("[data-year-filter]");
const list = document.querySelector("[data-resource-list]");
const emptyContainer = document.querySelector("[data-resource-empty]");
const countNode = document.querySelector("[data-resource-count]");

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") || "",
    workspace: params.get("workspace") || "",
    year: params.get("year") || ""
  };
}

function setParams({ q, workspace, year }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (workspace) params.set("workspace", workspace);
  if (year) params.set("year", year);
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
  history.replaceState(null, "", next);
}

function populateFilters(preserve = true) {
  const currentWorkspace = preserve ? workspaceFilter.value : "";
  const currentYear = preserve ? yearFilter.value : "";

  workspaceFilter.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
  data.workspaces.forEach((workspace) => {
    const option = document.createElement("option");
    option.value = workspace.id;
    option.textContent = workspace.title;
    workspaceFilter.append(option);
  });

  yearFilter.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
  [...new Set(data.resources.map((item) => item.year).filter(Boolean))].sort((a, b) => b - a).forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearFilter.append(option);
  });

  if ([...workspaceFilter.options].some((option) => option.value === currentWorkspace)) workspaceFilter.value = currentWorkspace;
  if ([...yearFilter.options].some((option) => option.value === currentYear)) yearFilter.value = currentYear;
}

function render() {
  const q = searchInput.value.trim();
  const workspace = workspaceFilter.value;
  const year = yearFilter.value;

  let results = q ? searchResources(data.resources, q, data.synonyms) : data.resources.slice();
  if (workspace) results = results.filter((item) => item.workspaceId === workspace);
  if (year) results = results.filter((item) => String(item.year) === year);
  results.sort((a, b) => b.year - a.year || a.workspaceTitle.localeCompare(b.workspaceTitle, "id") || a.title.localeCompare(b.title, "id"));

  list.replaceChildren();
  emptyContainer.replaceChildren();
  results.forEach((resource) => list.append(resourceCard(resource)));
  if (!results.length) emptyContainer.append(emptyState("Tidak ada folder yang sesuai", "Ubah kata pencarian atau hapus salah satu filter."));
  countNode.textContent = String(results.length);
  setParams({ q, workspace, year });
  announce(`${results.length} folder ditemukan.`);
}

const initial = getParams();
populateFilters(false);
searchInput.value = initial.q;
workspaceFilter.value = initial.workspace;
yearFilter.value = initial.year;
render();

searchInput.addEventListener("input", debounce(render));
workspaceFilter.addEventListener("change", render);
yearFilter.addEventListener("change", render);
document.querySelector("[data-filter-reset]").addEventListener("click", () => {
  searchInput.value = "";
  workspaceFilter.value = "";
  yearFilter.value = "";
  render();
  searchInput.focus();
});

window.addEventListener("popstate", () => {
  const state = getParams();
  searchInput.value = state.q;
  workspaceFilter.value = state.workspace;
  yearFilter.value = state.year;
  render();
});

setDataStatus("Menyinkronkan Google Sheets…", "loading");
refreshFromSheets()
  .then((result) => {
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      populateFilters(true);
      render();
      setDataStatus("Terhubung ke Google Sheets", "connected");
    } else {
      setDataStatus("Data lokal siap", "ready");
    }
  })
  .catch(() => setDataStatus("Data lokal aktif", "warning"));
