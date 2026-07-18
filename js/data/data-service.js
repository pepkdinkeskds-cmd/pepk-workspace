import { CONFIG } from "../config.js";
import { LOCAL_DATA } from "./local-data.js";
import { loadSheet } from "./sheets.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function splitList(value = "") {
  return String(value).split(/[|;,]/).map((item) => item.trim()).filter(Boolean);
}

function toBoolean(value) {
  return !["false", "0", "tidak", "no", ""].includes(String(value).trim().toLowerCase());
}

function isAllowedExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function deriveResource(row) {
  const title = row.title || "";
  const type = row.type === "application" ? "application" : "document";
  const yearMatch = type === "application" ? null : title.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const category = type === "application" ? (row.category || "Aplikasi") : title.replace(/\s+20\d{2}\b/, "").trim();
  const keywords = splitList(row.keywords);
  return {
    id: row.id,
    title,
    description: row.description || (type === "application" ? `Aplikasi ${title}.` : `Folder ${title}.`),
    type,
    workspaceId: row.workspace_id,
    workspaceTitle: "",
    category,
    year,
    url: row.url,
    keywords,
    aliases: splitList(row.aliases),
    icon: row.icon || (type === "application" ? "apps" : "folder"),
    openMode: row.open_mode === "same_tab" ? "same_tab" : "new_tab",
    sortOrder: Number(row.sort_order || 999),
    isActive: toBoolean(row.is_active),
    subfolders: type === "application" ? [] : keywords.filter((item) => ![category.toLowerCase(), String(year)].includes(item.toLowerCase()))
  };
}

function buildGroups(resources, fallbackGroups) {
  const fallbackByKey = new Map(fallbackGroups.map((group) => [`${group.workspaceId}|${group.title}`, group]));
  const grouped = new Map();

  resources.filter((resource) => resource.type !== "application").forEach((resource) => {
    const key = `${resource.workspaceId}|${resource.category}`;
    if (!grouped.has(key)) {
      const fallback = fallbackByKey.get(key);
      grouped.set(key, {
        id: fallback?.id || `${resource.workspaceId}-${resource.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        workspaceId: resource.workspaceId,
        title: resource.category,
        url: fallback?.url || "",
        icon: fallback?.icon || "folder",
        years: []
      });
    }
    grouped.get(key).years.push({ year: resource.year, resourceId: resource.id, url: resource.url });
  });

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      years: group.years.filter((item) => item.year).sort((a, b) => b.year - a.year)
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "id"));
}

function normalizeWorkspaces(rows) {
  const fallbackMap = new Map(LOCAL_DATA.workspaces.map((item) => [item.id, item]));
  return rows
    .filter((row) => row.id && row.title && toBoolean(row.is_active))
    .map((row) => {
      const fallback = fallbackMap.get(row.id) || {};
      const rootUrl = row.root_url || fallback.rootUrl || "";
      return {
        id: row.id,
        title: row.title,
        description: row.description || fallback.description || "",
        icon: row.icon || fallback.icon || "folder",
        rootUrl: isAllowedExternalUrl(rootUrl) ? rootUrl : "",
        sortOrder: Number(row.sort_order || fallback.sortOrder || 999),
        isActive: true,
        groupCount: fallback.groupCount || 0,
        resourceCount: fallback.resourceCount || 0,
        applicationCount: fallback.applicationCount || 0
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeQuickAccess(rows) {
  return rows
    .filter((row) => row.resource_id && toBoolean(row.is_active))
    .sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999))
    .map((row) => row.resource_id);
}

function informationIcon(id) {
  const map = {
    "panduan-pencarian": "search",
    "struktur-folder": "folder",
    "akses-folder": "shield",
    "launchpad-aplikasi": "apps",
    "mode-google-sites": "external",
    "pemecahan-masalah": "alert"
  };
  return map[id] || "info";
}

function normalizeInformation(rows) {
  return rows
    .filter((row) => row.id && row.title && toBoolean(row.is_active))
    .map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary || "",
      content: row.content || "",
      icon: row.icon || informationIcon(row.id),
      date: row.date || "",
      sortOrder: Number(row.sort_order || 999),
      isActive: true
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeSynonyms(rows) {
  return rows.filter((row) => row.term && toBoolean(row.is_active)).map((row) => ({
    term: row.term,
    synonyms: splitList(row.synonyms)
  }));
}

function normalizeSettings(rows) {
  const keyMap = {
    app_version: "appVersion",
    content_updated_at: "contentUpdatedAt",
    workspace_title: "appName",
    search_minimum: "searchMinimum",
    home_result_limit: "homeResultLimit"
  };
  const numericKeys = new Set(["searchMinimum", "homeResultLimit"]);
  const settings = {};
  rows.filter((row) => row.key).forEach((row) => {
    const key = keyMap[row.key] || row.key;
    settings[key] = numericKeys.has(key) ? Number(row.value || 0) : row.value;
  });
  return settings;
}

function mergeMigrationResources(sheetResources) {
  const hasSheetApplications = sheetResources.some((item) => item.type === "application");
  if (hasSheetApplications) return sheetResources;
  return [...sheetResources, ...clone(LOCAL_DATA.resources.filter((item) => item.type === "application"))];
}

function mergeMigrationQuickAccess(sheetQuickAccess) {
  const localApplicationIds = LOCAL_DATA.quickAccess.filter((id) => LOCAL_DATA.resources.some((item) => item.id === id && item.type === "application"));
  const hasApplicationQuickAccess = sheetQuickAccess.some((id) => localApplicationIds.includes(id));
  return hasApplicationQuickAccess ? sheetQuickAccess : [...sheetQuickAccess, ...localApplicationIds];
}


function mergeMigrationInformation(sheetInformation) {
  const ids = new Set(sheetInformation.map((item) => item.id));
  return [...sheetInformation, ...clone(LOCAL_DATA.information.filter((item) => !ids.has(item.id)))]
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mergeMigrationSynonyms(sheetSynonyms) {
  const terms = new Set(sheetSynonyms.map((item) => item.term.toLowerCase()));
  return [...sheetSynonyms, ...clone(LOCAL_DATA.synonyms.filter((item) => !terms.has(item.term.toLowerCase())))];
}

function deduplicateById(resources) {
  const seen = new Set();
  return resources.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function validateData(data) {
  const warnings = [];
  const workspaceIds = new Set(data.workspaces.map((item) => item.id));
  const resourceIds = new Set();

  data.resources.forEach((resource) => {
    if (resourceIds.has(resource.id)) warnings.push(`ID resource duplikat: ${resource.id}`);
    resourceIds.add(resource.id);
    if (!workspaceIds.has(resource.workspaceId)) warnings.push(`Ruang kerja tidak ditemukan: ${resource.id}`);
    if (!isAllowedExternalUrl(resource.url)) warnings.push(`URL tidak valid: ${resource.id}`);
  });

  data.quickAccess.forEach((id) => {
    if (!resourceIds.has(id)) warnings.push(`Quick Access tidak menemukan resource: ${id}`);
  });

  return warnings;
}

export function getInitialData() {
  const data = clone(LOCAL_DATA);
  const workspaceTitles = new Map(data.workspaces.map((item) => [item.id, item.title]));
  data.resources.forEach((item) => { item.workspaceTitle = workspaceTitles.get(item.workspaceId) || item.workspaceId; });
  data.validationWarnings = validateData(data);
  return data;
}

export async function refreshFromSheets() {
  const entries = Object.entries(CONFIG.sheets);
  const results = await Promise.allSettled(entries.map(([, sheetName]) => loadSheet(sheetName)));
  const loaded = Object.fromEntries(entries.map(([key], index) => [key, results[index].status === "fulfilled" ? results[index].value : null]));

  const data = getInitialData();
  let changed = false;

  if (loaded.workspaces?.length) {
    const normalized = normalizeWorkspaces(loaded.workspaces);
    if (normalized.length) {
      data.workspaces = normalized;
      changed = true;
    }
  }

  if (loaded.resources?.length) {
    const normalized = loaded.resources
      .map(deriveResource)
      .filter((item) => item.id && item.title && item.workspaceId && item.url && item.isActive && isAllowedExternalUrl(item.url));
    if (normalized.length) {
      const merged = deduplicateById(mergeMigrationResources(normalized));
      const workspaceTitles = new Map(data.workspaces.map((item) => [item.id, item.title]));
      merged.forEach((item) => { item.workspaceTitle = workspaceTitles.get(item.workspaceId) || item.workspaceId; });
      data.resources = merged.sort((a, b) => a.sortOrder - b.sortOrder);
      data.groups = buildGroups(data.resources, LOCAL_DATA.groups);
      changed = true;
    }
  }

  if (loaded.quickAccess?.length) {
    const normalized = normalizeQuickAccess(loaded.quickAccess);
    if (normalized.length) {
      data.quickAccess = [...new Set(mergeMigrationQuickAccess(normalized))];
      changed = true;
    }
  }

  if (loaded.information?.length) {
    const normalized = normalizeInformation(loaded.information);
    if (normalized.length) {
      data.information = mergeMigrationInformation(normalized);
      changed = true;
    }
  }

  if (loaded.synonyms?.length) {
    const normalized = normalizeSynonyms(loaded.synonyms);
    if (normalized.length) {
      data.synonyms = mergeMigrationSynonyms(normalized);
      changed = true;
    }
  }

  if (loaded.settings?.length) {
    data.settings = { ...data.settings, ...normalizeSettings(loaded.settings) };
    changed = true;
  }

  data.validationWarnings = validateData(data);
  const failedSheets = results
    .map((result, index) => result.status === "rejected" ? entries[index][1] : null)
    .filter(Boolean);

  return {
    data,
    changed,
    partialFailure: failedSheets.length > 0,
    failedSheets,
    warnings: data.validationWarnings
  };
}
