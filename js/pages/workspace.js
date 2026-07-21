import {
  initApp,
  debounce,
  announce,
  setDataStatus,
  applyMetadata,
  scheduleBackgroundTask,
  minimumSearchLength,
  updateQueryString,
  safeUrl
} from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.4-deep-search";
import { searchResources } from "../search.js";
import { applicationCard, emptyState, groupCard } from "../ui.js";
import { icon } from "../icons.js";

initApp("workspace");

let data = getInitialData();
applyMetadata(data.settings);
const initialParams = new URLSearchParams(window.location.search);
let workspaceId = initialParams.get("id") || "perencanaan";
let query = initialParams.get("q") || "";

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
const rootLink = document.querySelector("[data-workspace-root-link]");
const libraryLink = document.querySelector("[data-workspace-library-link]");
const statsNode = document.querySelector("[data-workspace-stats]");
const monevCallout = document.querySelector("[data-monev-workspace-callout]");
const documentsHeading = document.querySelector("[data-workspace-documents-heading]");

searchInput.value = query;

function referenceWorkspace() {
  return {
    id: "document-center",
    title: "Referensi",
    description: "Dokumen pendukung, regulasi, pedoman, profil, dan bahan pertimbangan untuk mempercepat pekerjaan.",
    icon: "library",
    rootUrl: data.settings.documentCenterUrl || "",
    sortOrder: 5,
    isActive: true
  };
}

function availableWorkspaces() {
  return [...data.workspaces, referenceWorkspace()];
}

function activeWorkspace() {
  return availableWorkspaces().find((item) => item.id === workspaceId);
}

function renderTabs() {
  tabsNode.replaceChildren();
  availableWorkspaces().forEach((workspace) => {
    const link = document.createElement("a");
    link.href = `workspace.html?id=${encodeURIComponent(workspace.id)}`;
    link.textContent = workspace.title;
    if (workspace.id === workspaceId) link.setAttribute("aria-current", "page");
    tabsNode.append(link);
  });
}

function referenceGroups(resources) {
  const grouped = new Map();
  resources.forEach((resource) => {
    const title = resource.category || resource.title || "Referensi";
    if (!grouped.has(title)) {
      grouped.set(title, {
        id: `document-center-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        workspaceId: "document-center",
        title,
        icon: "library"
      });
    }
  });
  return [...grouped.values()].sort((left, right) => left.title.localeCompare(right.title, "id"));
}

function clearWorkspaceSearch() {
  query = "";
  searchInput.value = "";
  updateQueryString({ id: workspaceId, q: "" });
  render();
  searchInput.focus();
}

function renderActions(workspace) {
  if (workspace.rootUrl) {
    rootLink.hidden = false;
    rootLink.href = safeUrl(workspace.rootUrl);
    rootLink.setAttribute("aria-label", `Buka folder utama ${workspace.title} di tab baru`);
  } else {
    rootLink.hidden = true;
  }
  libraryLink.href = `resources.html?workspace=${encodeURIComponent(workspace.id)}`;
}

function renderStats(groups, applications, documents, workspace) {
  statsNode.replaceChildren();
  const entries = workspace.id === "document-center"
    ? [
        [String(groups.length), "Kelompok referensi"],
        [String(documents.length), "Folder referensi"]
      ]
    : [
        [String(groups.length), "Kelompok dokumen"],
        [String(documents.length), "Folder periode"],
        [String(applications.length), "Aplikasi"]
      ];

  entries.forEach(([value, label]) => {
    const item = document.createElement("span");
    item.className = "workspace-stat";
    const number = document.createElement("strong");
    number.textContent = value;
    const caption = document.createElement("span");
    caption.textContent = label;
    item.append(number, caption);
    statsNode.append(item);
  });
}

function render() {
  const workspace = activeWorkspace();
  groupsNode.replaceChildren();
  appsNode.replaceChildren();
  emptyNode.replaceChildren();
  statsNode.replaceChildren();

  if (monevCallout) monevCallout.hidden = workspaceId !== "evaluasi";
  if (documentsHeading) {
    documentsHeading.textContent = workspaceId === "document-center"
      ? "Kelompok referensi dan periode"
      : "Kelompok dokumen berdasarkan periode";
  }

  if (!workspace) {
    titleNode.textContent = "Ruang kerja tidak ditemukan";
    descriptionNode.textContent = "Pilih salah satu ruang kerja yang tersedia.";
    iconNode.innerHTML = icon("alert");
    subtitleNode.textContent = "Ruang kerja tersedia";
    appsSection.hidden = true;
    rootLink.hidden = true;
    libraryLink.hidden = true;
    emptyNode.append(emptyState("ID ruang kerja tidak valid", "Gunakan pilihan ruang kerja di atas untuk melanjutkan.", "alert", { label: "Buka Perencanaan", href: "workspace.html?id=perencanaan" }));
    renderTabs();
    return;
  }

  libraryLink.hidden = false;
  document.title = `${workspace.title} — PEPK Workspace`;
  titleNode.textContent = `Ruang Kerja ${workspace.title}`;
  descriptionNode.textContent = workspace.description;
  iconNode.innerHTML = icon(workspace.icon || "folder");
  renderTabs();
  renderActions(workspace);

  const workspaceResources = data.resources.filter((item) => item.workspaceId === workspaceId);
  const minimum = minimumSearchLength(data.settings);

  if (query && query.length < minimum) {
    subtitleNode.textContent = `Ketik minimal ${minimum} karakter untuk mencari`;
    appsSection.hidden = true;
    emptyNode.append(emptyState(
      `Ketik minimal ${minimum} karakter`,
      "Gunakan nama dokumen, aplikasi, tahun, atau kata kunci pekerjaan.",
      "search",
      { label: "Hapus pencarian", onClick: clearWorkspaceSearch }
    ));
    const allDocuments = workspaceResources.filter((item) => item.type !== "application");
    const allGroups = workspaceId === "document-center"
      ? referenceGroups(allDocuments)
      : data.groups.filter((group) => group.workspaceId === workspaceId);
    renderStats(allGroups, [], allDocuments, workspace);
    return;
  }

  const matchingResources = query ? searchResources(workspaceResources, query, data.synonyms) : workspaceResources;
  const matchingIds = new Set(matchingResources.map((item) => item.id));
  const applications = workspaceResources
    .filter((item) => item.type === "application" && (!query || matchingIds.has(item.id)))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "id"));
  const documents = workspaceResources.filter((item) => item.type !== "application");
  const workspaceGroups = workspaceId === "document-center"
    ? referenceGroups(documents)
    : data.groups.filter((group) => group.workspaceId === workspaceId);
  const groups = workspaceGroups
    .map((group) => ({
      group,
      resources: documents.filter((item) => item.category === group.title && (!query || matchingIds.has(item.id)))
    }))
    .filter((entry) => entry.resources.length);

  if (workspaceId === "document-center") {
    subtitleNode.textContent = query
      ? `${groups.length} kelompok referensi cocok dengan “${query}”`
      : `${groups.length} kelompok referensi tersedia`;
  } else {
    subtitleNode.textContent = query
      ? `${groups.length} kelompok dokumen • ${applications.length} aplikasi cocok dengan “${query}”`
      : `${groups.length} kelompok dokumen • ${applications.length} aplikasi tersedia`;
  }
  appsSection.hidden = !applications.length;
  appsCountNode.textContent = applications.length ? `${applications.length} aplikasi` : "";
  applications.forEach((application) => appsNode.append(applicationCard(application, { compact: true })));
  groups.forEach((entry) => groupsNode.append(groupCard(entry.group, entry.resources)));
  renderStats(groups, applications, documents.filter((item) => !query || matchingIds.has(item.id)), workspace);

  if (!groups.length && !applications.length) {
    emptyNode.append(emptyState(
      "Resource belum ditemukan",
      "Coba nama dokumen, aplikasi, tahun, atau kata kunci lain.",
      "search",
      { label: "Hapus pencarian", onClick: clearWorkspaceSearch }
    ));
  }
  announce(
    workspaceId === "document-center"
      ? `${groups.length} kelompok referensi ditampilkan.`
      : `${groups.length} kelompok dokumen dan ${applications.length} aplikasi ditampilkan.`
  );
}

searchInput.addEventListener("input", debounce(() => {
  query = searchInput.value.trim();
  updateQueryString({ id: workspaceId, q: query });
  render();
}));

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
