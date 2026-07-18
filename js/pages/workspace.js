import { initApp, debounce, announce, setDataStatus, applyMetadata } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js";
import { searchResources } from "../search.js";
import { emptyState, groupCard } from "../ui.js";
import { icon } from "../icons.js";

initApp("workspace");

let data = getInitialData();
applyMetadata(data.settings);
const params = new URLSearchParams(window.location.search);
let workspaceId = params.get("id") || "perencanaan";
let query = "";

const titleNode = document.querySelector("[data-workspace-title]");
const descriptionNode = document.querySelector("[data-workspace-description]");
const iconNode = document.querySelector("[data-workspace-icon]");
const subtitleNode = document.querySelector("[data-workspace-subtitle]");
const tabsNode = document.querySelector("[data-workspace-tabs]");
const groupsNode = document.querySelector("[data-document-groups]");
const emptyNode = document.querySelector("[data-workspace-empty]");
const searchInput = document.querySelector("[data-workspace-search]");

function activeWorkspace() {
  return data.workspaces.find((item) => item.id === workspaceId);
}

function renderTabs() {
  tabsNode.replaceChildren();
  data.workspaces.forEach((workspace) => {
    const link = document.createElement("a");
    link.href = `workspace.html?id=${encodeURIComponent(workspace.id)}`;
    link.textContent = workspace.title;
    if (workspace.id === workspaceId) link.setAttribute("aria-current", "page");
    tabsNode.append(link);
  });
}

function render() {
  const workspace = activeWorkspace();
  groupsNode.replaceChildren();
  emptyNode.replaceChildren();

  if (!workspace) {
    titleNode.textContent = "Ruang kerja tidak ditemukan";
    descriptionNode.textContent = "Pilih salah satu ruang kerja yang tersedia.";
    iconNode.innerHTML = icon("alert");
    subtitleNode.textContent = "Ruang kerja tersedia";
    emptyNode.append(emptyState("ID ruang kerja tidak valid", "Gunakan pilihan ruang kerja di atas untuk melanjutkan.", "alert"));
    renderTabs();
    return;
  }

  document.title = `${workspace.title} — PEPK Workspace`;
  titleNode.textContent = `Ruang Kerja ${workspace.title}`;
  descriptionNode.textContent = workspace.description;
  iconNode.innerHTML = icon(workspace.icon || "folder");
  subtitleNode.textContent = `${data.groups.filter((group) => group.workspaceId === workspaceId).length} kelompok dokumen tersedia`;
  renderTabs();

  const workspaceResources = data.resources.filter((item) => item.workspaceId === workspaceId);
  const matchingResources = query ? searchResources(workspaceResources, query, data.synonyms) : workspaceResources;
  const matchingIds = new Set(matchingResources.map((item) => item.id));
  const groups = data.groups
    .filter((group) => group.workspaceId === workspaceId)
    .map((group) => ({
      group,
      resources: workspaceResources.filter((item) => item.category === group.title && (!query || matchingIds.has(item.id)))
    }))
    .filter((entry) => entry.resources.length);

  groups.forEach((entry) => groupsNode.append(groupCard(entry.group, entry.resources)));
  if (!groups.length) {
    emptyNode.append(emptyState("Dokumen belum ditemukan", "Coba gunakan nama kelompok, tahun, atau nama subfolder."));
  }
  announce(`${groups.length} kelompok dokumen ditampilkan.`);
}

searchInput.addEventListener("input", debounce(() => {
  query = searchInput.value.trim();
  render();
}));

render();

setDataStatus("Menyinkronkan Google Sheets…", "loading");
refreshFromSheets()
  .then((result) => {
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      render();
      setDataStatus("Terhubung ke Google Sheets", "connected");
    } else {
      setDataStatus("Data lokal siap", "ready");
    }
  })
  .catch(() => setDataStatus("Data lokal aktif", "warning"));
