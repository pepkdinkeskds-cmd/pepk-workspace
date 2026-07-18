import { initApp, debounce, announce, setDataStatus, applyMetadata } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js";
import { searchResources } from "../search.js";
import { applicationCard, emptyState, groupCard } from "../ui.js";
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
const appsSection = document.querySelector("[data-workspace-apps-section]");
const appsNode = document.querySelector("[data-workspace-apps]");
const appsCountNode = document.querySelector("[data-workspace-app-count]");

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
  appsNode.replaceChildren();
  emptyNode.replaceChildren();

  if (!workspace) {
    titleNode.textContent = "Ruang kerja tidak ditemukan";
    descriptionNode.textContent = "Pilih salah satu ruang kerja yang tersedia.";
    iconNode.innerHTML = icon("alert");
    subtitleNode.textContent = "Ruang kerja tersedia";
    appsSection.hidden = true;
    emptyNode.append(emptyState("ID ruang kerja tidak valid", "Gunakan pilihan ruang kerja di atas untuk melanjutkan.", "alert"));
    renderTabs();
    return;
  }

  document.title = `${workspace.title} — PEPK Workspace`;
  titleNode.textContent = `Ruang Kerja ${workspace.title}`;
  descriptionNode.textContent = workspace.description;
  iconNode.innerHTML = icon(workspace.icon || "folder");
  renderTabs();

  const workspaceResources = data.resources.filter((item) => item.workspaceId === workspaceId);
  const matchingResources = query ? searchResources(workspaceResources, query, data.synonyms) : workspaceResources;
  const matchingIds = new Set(matchingResources.map((item) => item.id));
  const applications = workspaceResources
    .filter((item) => item.type === "application" && (!query || matchingIds.has(item.id)))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "id"));
  const documents = workspaceResources.filter((item) => item.type !== "application");
  const groups = data.groups
    .filter((group) => group.workspaceId === workspaceId)
    .map((group) => ({
      group,
      resources: documents.filter((item) => item.category === group.title && (!query || matchingIds.has(item.id)))
    }))
    .filter((entry) => entry.resources.length);

  subtitleNode.textContent = `${groups.length} kelompok dokumen • ${applications.length} aplikasi ditampilkan`;
  appsSection.hidden = !applications.length;
  appsCountNode.textContent = applications.length ? `${applications.length} aplikasi` : "";
  applications.forEach((application) => appsNode.append(applicationCard(application, { compact: true })));
  groups.forEach((entry) => groupsNode.append(groupCard(entry.group, entry.resources)));

  if (!groups.length && !applications.length) {
    emptyNode.append(emptyState("Resource belum ditemukan", "Coba gunakan nama dokumen, aplikasi, tahun, atau kata kunci pekerjaan."));
  }
  announce(`${groups.length} kelompok dokumen dan ${applications.length} aplikasi ditampilkan.`);
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
