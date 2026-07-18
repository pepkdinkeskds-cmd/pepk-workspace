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

function deriveResource(row) {
  const title = row.title || "";
  const yearMatch = title.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const category = title.replace(/\s+20\d{2}\b/, "").trim();
  return {
    id: row.id,
    title,
    description: row.description || `Folder ${title}.`,
    type: row.type || "document",
    workspaceId: row.workspace_id,
    workspaceTitle: "",
    category,
    year,
    url: row.url,
    keywords: splitList(row.keywords),
    aliases: splitList(row.aliases),
    icon: row.icon || "folder",
    openMode: row.open_mode || "new_tab",
    sortOrder: Number(row.sort_order || 999),
    isActive: toBoolean(row.is_active),
    subfolders: splitList(row.keywords).filter((item) => ![category.toLowerCase(), String(year)].includes(item.toLowerCase()))
  };
}

function buildGroups(resources, fallbackGroups) {
  const fallbackByKey = new Map(fallbackGroups.map((group) => [`${group.workspaceId}|${group.title}`, group]));
  const grouped = new Map();

  resources.forEach((resource) => {
    const key = `${resource.workspaceId}|${resource.category}`;
    if (!grouped.has(key)) {
      const fallback = fallbackByKey.get(key);
      grouped.set(key, {
        id: fallback?.id || `${resource.workspaceId}-${resource.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        workspaceId: resource.workspaceId,
        title: resource.category,
        url: fallback?.url || "",
        icon: "folder",
        years: []
      });
    }
    grouped.get(key).years.push({ year: resource.year, resourceId: resource.id, url: resource.url });
  });

  return [...grouped.values()].map((group) => ({
    ...group,
    years: group.years.filter((item) => item.year).sort((a, b) => b.year - a.year)
  }));
}

function normalizeWorkspaces(rows) {
  return rows.filter((row) => row.id && row.title && toBoolean(row.is_active)).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || "",
    icon: row.icon || "folder",
    sortOrder: Number(row.sort_order || 999),
    isActive: true
  }));
}

function normalizeQuickAccess(rows) {
  return rows.filter((row) => row.resource_id && toBoolean(row.is_active)).sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999)).map((row) => row.resource_id);
}

function normalizeInformation(rows) {
  return rows.filter((row) => row.id && row.title && toBoolean(row.is_active)).map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary || "",
    content: row.content || "",
    icon: "info",
    date: "",
    sortOrder: Number(row.sort_order || 999),
    isActive: true
  }));
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
  const settings = {};
  rows.filter((row) => row.key).forEach((row) => {
    const key = keyMap[row.key] || row.key;
    const numericKeys = new Set(["searchMinimum", "homeResultLimit"]);
    settings[key] = numericKeys.has(key) ? Number(row.value || 0) : row.value;
  });
  return settings;
}

export function getInitialData() {
  return clone(LOCAL_DATA);
}

export async function refreshFromSheets() {
  const entries = Object.entries(CONFIG.sheets);
  const results = await Promise.allSettled(entries.map(([, sheetName]) => loadSheet(sheetName)));
  const loaded = Object.fromEntries(entries.map(([key], index) => [key, results[index].status === "fulfilled" ? results[index].value : null]));

  const data = clone(LOCAL_DATA);
  let changed = false;

  if (loaded.workspaces?.length) {
    const normalized = normalizeWorkspaces(loaded.workspaces);
    if (normalized.length) {
      data.workspaces = normalized;
      changed = true;
    }
  }

  if (loaded.resources?.length) {
    const normalized = loaded.resources.map(deriveResource).filter((item) => item.id && item.title && item.workspaceId && item.url && item.isActive);
    if (normalized.length) {
      const workspaceTitles = new Map(data.workspaces.map((item) => [item.id, item.title]));
      normalized.forEach((item) => { item.workspaceTitle = workspaceTitles.get(item.workspaceId) || item.workspaceId; });
      data.resources = normalized.sort((a, b) => a.sortOrder - b.sortOrder);
      data.groups = buildGroups(data.resources, LOCAL_DATA.groups);
      changed = true;
    }
  }

  if (loaded.quickAccess?.length) {
    const normalized = normalizeQuickAccess(loaded.quickAccess);
    if (normalized.length) data.quickAccess = normalized;
  }

  if (loaded.information?.length) {
    const normalized = normalizeInformation(loaded.information);
    if (normalized.length) data.information = normalized;
  }

  if (loaded.synonyms?.length) {
    const normalized = normalizeSynonyms(loaded.synonyms);
    if (normalized.length) data.synonyms = normalized;
  }

  if (loaded.settings?.length) {
    data.settings = { ...data.settings, ...normalizeSettings(loaded.settings) };
  }

  return { data, changed, partialFailure: results.some((result) => result.status === "rejected") };
}
