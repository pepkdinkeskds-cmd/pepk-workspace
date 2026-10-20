import { CONFIG } from "../config.js?v=0.9.7-rc3";
import { LOCAL_DATA } from "./local-data.js?v=0.9.7-rc3";
import { loadSheet } from "./sheets.js?v=0.9.7-rc3";
import { readCache, saveCache } from "./cache.js?v=0.9.7-rc3";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function splitList(value = "") {
  return String(value).split(/[|;,]/).map((item) => item.trim()).filter(Boolean);
}

function toBoolean(value) {
  return !["false", "0", "tidak", "no", ""].includes(String(value).trim().toLowerCase());
}

function toNumber(value, fallback = 0) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  let normalized = text;
  if (text.includes(",") && text.includes(".")) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (text.includes(",")) normalized = text.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeDate(value = "") {
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : "";
}

function normalizeTime(value = "") {
  const text = String(value).trim().replace(".", ":");
  const match = text.match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) return "";
  const hour = Number(match[1]);
  return hour >= 0 && hour <= 23 ? `${String(hour).padStart(2, "0")}:${match[2]}` : "";
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
  const workspaceId = row.workspace_id || "";
  const scope = row.scope === "reference" || workspaceId === "document-center" ? "reference" : "workspace";
  const periodYears = String(row.period || title).match(/\b20\d{2}\b/g)?.map(Number) || [];
  const yearStart = type === "application" ? null : (toNumber(row.year_start, periodYears[0] || 0) || null);
  const yearEnd = type === "application" ? null : (toNumber(row.year_end, periodYears.at(-1) || yearStart || 0) || null);
  const year = yearStart && yearEnd && yearStart === yearEnd ? yearStart : null;
  const period = type === "application"
    ? ""
    : (row.period || (yearStart ? (yearStart === yearEnd ? String(yearStart) : `${yearStart} - ${yearEnd}`) : ""));
  const category = type === "application"
    ? (row.category || "Aplikasi")
    : (row.category || title.replace(/\s+20\d{2}(?:\s*[-–]\s*20\d{2})?\b/, "").trim() || title);
  const keywords = splitList(row.keywords);
  const exclusions = new Set([
    workspaceId.toLowerCase(),
    category.toLowerCase(),
    period.toLowerCase(),
    "google drive",
    "folder",
    "dokumen"
  ]);
  return {
    id: row.id,
    title,
    description: row.description || (type === "application" ? `Aplikasi ${title}.` : `Folder ${title}.`),
    type,
    workspaceId,
    workspaceTitle: "",
    category,
    period,
    year,
    yearStart,
    yearEnd,
    sortYear: yearEnd || yearStart || 0,
    scope,
    url: row.url,
    keywords,
    aliases: splitList(row.aliases),
    icon: row.icon || (type === "application" ? "apps" : "folder"),
    openMode: row.open_mode === "same_tab" ? "same_tab" : "new_tab",
    sortOrder: Number(row.sort_order || 999),
    isActive: toBoolean(row.is_active),
    updatedAt: normalizeDate(row.updated_at || row.published_at),
    subfolders: type === "application"
      ? []
      : keywords.filter((item) => {
          const normalized = item.toLowerCase();
          return !exclusions.has(normalized) && !/^20\d{2}(?:\s*[-–]\s*20\d{2})?$/.test(normalized);
        })
  };
}

function buildGroups(resources, fallbackGroups) {
  const fallbackByKey = new Map(fallbackGroups.map((group) => [`${group.workspaceId}|${group.title}`, group]));
  const grouped = new Map();

  resources
    .filter((resource) => resource.type !== "application" && resource.scope !== "reference")
    .forEach((resource) => {
      const key = `${resource.workspaceId}|${resource.category}`;
      if (!grouped.has(key)) {
        const fallback = fallbackByKey.get(key);
        grouped.set(key, {
          id: fallback?.id || `${resource.workspaceId}-${resource.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          workspaceId: resource.workspaceId,
          title: resource.category,
          url: fallback?.url || "",
          icon: fallback?.icon || "folder",
          periods: []
        });
      }
      grouped.get(key).periods.push({
        period: resource.period || (resource.year ? String(resource.year) : "Umum"),
        year: resource.year,
        yearStart: resource.yearStart,
        yearEnd: resource.yearEnd,
        sortYear: resource.sortYear || 0,
        resourceId: resource.id,
        url: resource.url
      });
    });

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      periods: group.periods.sort((a, b) => b.sortYear - a.sortYear || a.period.localeCompare(b.period, "id")),
      years: group.periods
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "id"));
}


function workspaceTitleForResource(resource, workspaceTitles) {
  if (workspaceTitles.has(resource.workspaceId)) return workspaceTitles.get(resource.workspaceId);
  if (resource.scope === "reference" || resource.workspaceId === "document-center") return "Referensi";
  return resource.workspaceId;
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
    "pemecahan-masalah": "alert",
    "kontribusi-aman": "upload"
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


function normalizeAgenda(rows) {
  return rows
    .filter((row) => row.id && row.title && normalizeDate(row.date) && toBoolean(row.is_active))
    .map((row) => ({
      id: row.id,
      title: row.title,
      date: normalizeDate(row.date),
      startTime: normalizeTime(row.start_time),
      endTime: normalizeTime(row.end_time),
      category: row.category || "Agenda",
      location: row.location || "",
      pic: row.pic || "",
      description: row.description || "",
      url: isAllowedExternalUrl(row.url) ? row.url : "",
      sortOrder: Number(row.sort_order || 999),
      isActive: true
    }))
    .sort((a, b) => `${a.date}T${a.startTime || "00:00"}`.localeCompare(`${b.date}T${b.startTime || "00:00"}`) || a.sortOrder - b.sortOrder);
}

const MONTH_INDEX = new Map([
  ["januari", 1], ["jan", 1], ["februari", 2], ["feb", 2], ["maret", 3], ["mar", 3],
  ["april", 4], ["apr", 4], ["mei", 5], ["juni", 6], ["jun", 6], ["juli", 7], ["jul", 7],
  ["agustus", 8], ["agu", 8], ["september", 9], ["sep", 9], ["oktober", 10], ["okt", 10],
  ["november", 11], ["nov", 11], ["desember", 12], ["des", 12]
]);

function parsePeriod(value = "") {
  const text = String(value).trim().toLowerCase();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const month = [...MONTH_INDEX.entries()].find(([name]) => new RegExp(`\\b${name}\\b`).test(text))?.[1] || 0;
  return { year: yearMatch ? Number(yearMatch[1]) : 0, month };
}

function normalizeMonthlyRealization(rows) {
  return rows
    .filter((row) => row.id && toBoolean(row.is_active))
    .map((row) => ({
      id: row.id,
      year: toNumber(row.year),
      month: toNumber(row.month),
      financialValue: toNumber(row.financial_value, NaN),
      physicalValue: toNumber(row.physical_value, NaN),
      financialTarget: toNumber(row.financial_target ?? row.target_financial, NaN),
      physicalTarget: toNumber(row.physical_target ?? row.target_physical, NaN),
      updatedAt: normalizeDate(row.updated_at),
      description: row.description || "",
      sortOrder: Number(row.sort_order || row.month || 999),
      isActive: true
    }))
    .filter((item) => item.year >= 2000 && item.year <= 2100 && item.month >= 1 && item.month <= 12 && Number.isFinite(item.financialValue) && Number.isFinite(item.physicalValue));
}

function normalizeLegacyRealization(rows) {
  const grouped = new Map();
  rows.filter((row) => row.id && row.title && toBoolean(row.is_active)).forEach((row) => {
    const period = parsePeriod(row.period);
    if (!period.year || !period.month) return;
    const key = `${period.year}-${period.month}`;
    if (!grouped.has(key)) grouped.set(key, {
      id: `realisasi-${period.year}-${String(period.month).padStart(2, "0")}`,
      year: period.year,
      month: period.month,
      financialValue: NaN,
      physicalValue: NaN,
      updatedAt: normalizeDate(row.updated_at),
      description: row.description || "",
      sortOrder: period.month,
      isActive: true
    });
    const item = grouped.get(key);
    const title = String(row.title).toLowerCase();
    const field = /fisik/.test(title) ? "physicalValue" : /anggaran|keuangan/.test(title) ? "financialValue" : "";
    if (!field || Number.isFinite(item[field])) throw new Error("Komponen realisasi lama tidak dikenal atau duplikat.");
    if (/fisik/.test(title)) item.physicalValue = toNumber(row.value, NaN);
    if (/anggaran|keuangan/.test(title)) item.financialValue = toNumber(row.value, NaN);
    if (!item.updatedAt) item.updatedAt = normalizeDate(row.updated_at);
  });
  const values = [...grouped.values()];
  if (values.some((item) => !Number.isFinite(item.financialValue) || !Number.isFinite(item.physicalValue))) throw new Error("Pasangan realisasi lama belum lengkap.");
  return values;
}

function normalizeRealization(rows) {
  const official = rows.filter((row) => !isDemoRow(row));
  const hasMonthlySchema = official.some((row) => row.year || row.month || row.financial_value || row.physical_value);
  const normalized = hasMonthlySchema ? normalizeMonthlyRealization(official) : normalizeLegacyRealization(official);
  if (normalized.some((r) => r.financialValue < 0 || r.financialValue > 100 || r.physicalValue < 0 || r.physicalValue > 100)) throw new Error("Persentase realisasi harus berada dalam 0–100.");
  const keys = new Set();
  for (const row of normalized) {
    const key = `${row.year}-${row.month}`;
    if (keys.has(key)) throw new Error(`Periode realisasi duplikat: ${key}`);
    keys.add(key);
  }
  return normalized.sort((a, b) => a.year - b.year || a.month - b.month || a.sortOrder - b.sortOrder);
}

export function isDemoRow(row = {}) {
  return /\b(contoh|dummy|demo|sample)\b/i.test(`${row.title || ""} ${row.description || ""}`);
}


function normalizeMonevMaterials(rows) {
  return rows
    .filter((row) => row.material_id && row.title && row.file_url && toBoolean(row.is_active) && isAllowedExternalUrl(row.file_url))
    .map((row) => ({
      id: row.material_id,
      year: toNumber(row.year),
      month: toNumber(row.month),
      meetingDate: normalizeDate(row.meeting_date),
      senderType: row.sender_type || "Unit",
      unitName: row.unit_name || "Unit tidak dicantumkan",
      presenter: row.presenter || "",
      title: row.title,
      presentationOrder: toNumber(row.presentation_order, 999),
      description: row.description || "",
      fileName: row.file_name || row.title,
      fileType: row.file_type || "Dokumen",
      fileUrl: row.file_url,
      folderUrl: isAllowedExternalUrl(row.folder_url) ? row.folder_url : "",
      publishedAt: normalizeDate(row.published_at),
      isActive: true
    }))
    .filter((item) => item.year >= 2000 && item.year <= 2100 && item.month >= 1 && item.month <= 12)
    .sort((a, b) => b.year - a.year || b.month - a.month || a.presentationOrder - b.presentationOrder || a.title.localeCompare(b.title, "id"));
}


function normalizeSearchIndex(rows) {
  return rows
    .filter((row) => row.id && row.title && row.folder_url && toBoolean(row.is_active))
    .map((row) => {
      const periodYears = String(row.period || "").match(/\b20\d{2}\b/g)?.map(Number) || [];
      const yearStart = toNumber(row.year_start, periodYears[0] || 0) || null;
      const yearEnd = toNumber(row.year_end, periodYears.at(-1) || yearStart || 0) || null;
      const workspaceId = row.workspace_id || "";
      const scope = row.scope === "reference" || workspaceId === "document-center" ? "reference" : "workspace";
      return {
        id: row.id,
        title: row.title,
        leafName: row.leaf_name || row.title,
        description: row.description || `Jalur: ${row.path || ""}`,
        type: "document",
        kind: "deep-folder",
        searchOnly: true,
        workspaceId,
        workspaceTitle: row.workspace_title || (scope === "reference" ? "Referensi" : workspaceId),
        category: row.category || "",
        period: row.period || "",
        year: yearStart && yearEnd && yearStart === yearEnd ? yearStart : null,
        yearStart,
        yearEnd,
        sortYear: yearEnd || yearStart || 0,
        scope,
        url: row.folder_url,
        keywords: splitList(row.keywords),
        aliases: splitList(row.aliases),
        icon: "folder",
        openMode: "new_tab",
        sortOrder: Number(row.sort_order || 9999),
        isActive: true,
        subfolders: [],
        path: row.path || "",
        parentPath: row.parent_path || "",
        depth: Number(row.depth || 0)
      };
    })
    .filter((item) => isAllowedExternalUrl(item.url))
    .sort((a, b) => b.sortYear - a.sortYear || a.path.localeCompare(b.path, "id"));
}

function normalizeSynonyms(rows) {
  return rows.filter((row) => row.term && toBoolean(row.is_active)).map((row) => ({
    term: row.term,
    synonyms: splitList(row.synonyms)
  }));
}

function normalizeSettingKey(value) {
  return String(value ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeSettingValue(value, rawKey) {
  const text = String(value ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  return rawKey.endsWith("_url") ? text.replace(/\s+/g, "") : text;
}

function normalizeSettings(rows) {
  const keyMap = {
    app_version: "appVersion",
    content_updated_at: "contentUpdatedAt",
    workspace_title: "appName",
    search_minimum: "searchMinimum",
    home_result_limit: "homeResultLimit",
    quick_folder_limit: "quickFolderLimit",
    quick_app_limit: "quickAppLimit",
    agenda_home_limit: "agendaHomeLimit",
    realization_home_limit: "realizationHomeLimit",
    deviation_balanced_threshold: "deviationBalancedThreshold",
    deviation_attention_threshold: "deviationAttentionThreshold",
    workflow_enabled: "workflowEnabled",
    document_upload_form_url: "documentUploadFormUrl",
    agenda_submit_form_url: "agendaSubmitFormUrl",
    monev_material_form_url: "monevMaterialFormUrl",
    data_model_version: "dataModelVersion",
    workflow_version: "workflowVersion",
    workspace_generation: "workspaceGeneration",
    folder_root_url: "folderRootUrl",
    document_center_url: "documentCenterUrl",
    deep_search_enabled: "deepSearchEnabled",
    search_index_version: "searchIndexVersion",
    search_index_updated_at: "searchIndexUpdatedAt",
    search_index_count: "searchIndexCount"
  };
  const numericKeys = new Set(["searchMinimum", "homeResultLimit", "quickFolderLimit", "quickAppLimit", "agendaHomeLimit", "realizationHomeLimit", "deviationBalancedThreshold", "deviationAttentionThreshold", "searchIndexCount"]);
  const booleanKeys = new Set(["workflowEnabled", "deepSearchEnabled"]);
  const settings = {};
  rows.forEach((row) => {
    const rawKey = normalizeSettingKey(row.key);
    if (!rawKey) return;
    const key = keyMap[rawKey] || rawKey;
    const value = normalizeSettingValue(row.value, rawKey);
    settings[key] = numericKeys.has(key) ? Number(value || 0) : booleanKeys.has(key) ? toBoolean(value) : value;
  });
  return settings;
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
    if (!workspaceIds.has(resource.workspaceId) && resource.scope !== "reference") {
      warnings.push(`Ruang kerja tidak ditemukan: ${resource.id}`);
    }
    if (!isAllowedExternalUrl(resource.url)) warnings.push(`URL tidak valid: ${resource.id}`);
  });

  data.quickAccess.forEach((id) => {
    if (!resourceIds.has(id)) warnings.push(`Quick Access tidak menemukan resource: ${id}`);
  });

  const searchIndexIds = new Set();
  (data.searchIndex || []).forEach((item) => {
    if (searchIndexIds.has(item.id)) warnings.push(`ID indeks pencarian duplikat: ${item.id}`);
    searchIndexIds.add(item.id);
    if (!isAllowedExternalUrl(item.url)) warnings.push(`URL folder langsung tidak valid: ${item.id}`);
  });

  data.agenda.forEach((item) => {
    if (!item.date) warnings.push(`Tanggal agenda tidak valid: ${item.id}`);
    if (item.url && !isAllowedExternalUrl(item.url)) warnings.push(`URL agenda tidak valid: ${item.id}`);
  });

  data.monevMaterials.forEach((item) => {
    if (!isAllowedExternalUrl(item.fileUrl)) warnings.push(`URL materi Monev tidak valid: ${item.id}`);
  });

  data.realization.forEach((item) => {
    if (!Number.isFinite(item.financialValue) || !Number.isFinite(item.physicalValue)) warnings.push(`Nilai realisasi tidak valid: ${item.id}`);
    if (item.financialValue < 0 || item.financialValue > 100 || item.physicalValue < 0 || item.physicalValue > 100) warnings.push(`Nilai realisasi di luar 0–100: ${item.id}`);
  });

  return warnings;
}

const normalizers = {
  workspaces: normalizeWorkspaces,
  resources: (rows) => deduplicateById(rows.map(deriveResource).filter((r) => r.id && r.title && r.workspaceId && r.isActive && isAllowedExternalUrl(r.url))).sort((a,b) => a.sortOrder-b.sortOrder),
  quickAccess: (rows) => [...new Set(normalizeQuickAccess(rows))],
  information: normalizeInformation,
  agenda: (rows) => normalizeAgenda(rows.filter((r) => !isDemoRow(r))),
  realization: normalizeRealization,
  monevMaterials: (rows) => normalizeMonevMaterials(rows.filter((r) => !isDemoRow(r))),
  synonyms: normalizeSynonyms,
  settings: normalizeSettings,
  searchIndex: normalizeSearchIndex
};

function finalize(data) {
  const titles = new Map(data.workspaces.map((r) => [r.id, r.title]));
  data.resources.forEach((r) => { r.workspaceTitle = workspaceTitleForResource(r, titles); });
  data.groups = buildGroups(data.resources, LOCAL_DATA.groups);
  data.validationWarnings = validateData(data);
  return data;
}

export function getInitialData() {
  const data = clone(LOCAL_DATA);
  data.searchIndex = [];
  data._meta = {};
  for (const section of Object.keys(CONFIG.sheets).filter((s) => s !== "searchIndex")) {
    const cached = readCache(section);
    if (cached) {
      data[section] = clone(cached.value);
      data._meta[section] = { source: "cache", checkedAt: cached.savedAt, fresh: cached.fresh, warnings: cached.warnings || [] };
    } else data._meta[section] = { source: "bundled", checkedAt: null, fresh: false, warnings: [] };
  }
  return finalize(data);
}

async function readSection(section, force = false) {
  const cached = readCache(section);
  if (!force && cached?.fresh) return { value: clone(cached.value), meta: { source: "cache", checkedAt: cached.savedAt, fresh: true, warnings: cached.warnings || [] } };
  const rows = await loadSheet(CONFIG.sheets[section]);
  validateRows(section, rows);
  const warnings = [];
  if (["realization", "agenda", "monevMaterials"].includes(section) && rows.some((r) => toBoolean(r.is_active) && isDemoRow(r))) warnings.push("Data contoh dikecualikan dari tampilan publik.");
  const value = normalizers[section](rows);
  const saved = saveCache(section, value, warnings);
  return { value, meta: { source: "live", checkedAt: saved.savedAt, fresh: true, warnings } };
}

export async function refreshSettingsFromSheets() {
  const result = await readSection("settings");
  return { ...result.value, serviceLinksSource: result.meta.source };
}

export async function refreshFromSheets(options = {}) {
  const page = typeof document !== "undefined" ? document.body?.dataset.page : "home";
  const sections = [...new Set(options.sections || CONFIG.pageSections[page] || CONFIG.pageSections.home)].filter((s) => s in normalizers && s !== "searchIndex");
  const data = getInitialData();
  const before = JSON.stringify(data);
  // Keep Google Sheets requests bounded instead of starting every tab at once.
  const results = new Array(sections.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, sections.length) }, async () => {
    while (cursor < sections.length) {
      const index = cursor++;
      try { results[index] = {status: "fulfilled", value: await readSection(sections[index], options.force)}; }
      catch (reason) { results[index] = {status: "rejected", reason}; }
    }
  }));
  const failedSheets = [];
  results.forEach((result, i) => {
    const section = sections[i];
    if (result.status === "fulfilled") {
      // An empty array is a successful authoritative empty state, never a fallback trigger.
      data[section] = result.value.value;
      data._meta[section] = result.value.meta;
    } else {
      failedSheets.push(CONFIG.sheets[section]);
      data._meta[section] = { ...data._meta[section], fresh: false, failed: true, error: String(result.reason?.message || "Pembaruan gagal") };
    }
  });
  finalize(data);
  return { data, changed: before !== JSON.stringify(data), partialFailure: failedSheets.length > 0, failedSheets,
    warnings: [...data.validationWarnings, ...sections.flatMap((s) => data._meta[s].warnings || [])],
    checkedAt: Math.max(0, ...sections.map((s) => data._meta[s].checkedAt || 0)), sections };
}

let indexPromise = null;
export async function ensureSearchIndex({ force = false } = {}) {
  if (indexPromise && !force) return indexPromise;
  indexPromise = (async () => {
    try {
      const result = await readSection("searchIndex", force);
      return { items: result.value, meta: result.meta };
    } catch {
      const cached = readCache("searchIndex");
      if (cached) return { items: clone(cached.value), meta: { source: "cache", checkedAt: cached.savedAt, fresh: false, failed: true } };
      const { BUNDLED_SEARCH_INDEX } = await import("./search-index.js?v=0.9.7-rc3");
      return { items: BUNDLED_SEARCH_INDEX, meta: { source: "bundled", checkedAt: null, fresh: false, failed: true } };
    }
  })();
  const result = await indexPromise;
  if (result.meta.failed) indexPromise = null;
  return result;
}

export function sourceDescription(data, section) {
  const meta = data._meta?.[section];
  if (!meta || meta.source === "bundled") return ["agenda", "realization", "monevMaterials"].includes(section)
    ? "Data daring belum terkonfirmasi; paket tidak menyertakan data contoh."
    : "Katalog bawaan paket; pembaruan daring belum terkonfirmasi.";
  const stamp = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(meta.checkedAt));
  return `${meta.source === "live" ? "Sumber publik dibaca" : "Salinan sumber terakhir dibaca"} ${stamp} WIB${meta.failed ? "; pembaruan terakhir gagal" : !meta.fresh ? "; salinan perlu diperbarui" : ""}.`;
}

function validateRows(section, rows) {
  const active = rows.filter((r) => toBoolean(r.is_active) && (!["realization", "agenda", "monevMaterials"].includes(section) || !isDemoRow(r)));
  const identifiers = new Set();
  const idKey = section === "monevMaterials" ? "material_id" : section === "quickAccess" ? "resource_id" : section === "synonyms" ? "term" : section === "settings" ? "key" : "id";
  for (const row of (section === "settings" ? rows : active)) {
    const id = row[idKey];
    if (!id || identifiers.has(id)) throw new Error(`Identitas kosong atau duplikat pada ${CONFIG.sheets[section]}.`);
    identifiers.add(id);
    if (section === "agenda" && (!row.title || !normalizeDate(row.date))) throw new Error("Judul/tanggal agenda tidak valid.");
    if (section === "realization" && !Object.hasOwn(row, "financial_value")) {
      const period = parsePeriod(row.period);
      if (!row.title || !period.year || !period.month || !Number.isFinite(toNumber(row.value, NaN))) throw new Error("Periode/nilai realisasi lama tidak valid.");
    }
    if (["resources", "searchIndex", "monevMaterials"].includes(section)) {
      const url = row.url || row.folder_url || row.file_url;
      if (!row.title || !isAllowedExternalUrl(url)) throw new Error("Judul/tautan sumber tidak valid.");
    }
    if (section === "realization" && Object.hasOwn(row, "financial_value")) {
      if (!Number.isInteger(toNumber(row.year, NaN)) || toNumber(row.year) < 2000 || toNumber(row.year) > 2100
        || !Number.isInteger(toNumber(row.month, NaN)) || toNumber(row.month) < 1 || toNumber(row.month) > 12
        || !Number.isFinite(toNumber(row.financial_value, NaN)) || !Number.isFinite(toNumber(row.physical_value, NaN))) throw new Error("Periode/nilai realisasi tidak valid.");
      for (const key of ["financial_target", "physical_target", "target_financial", "target_physical"]) {
        if (row[key] && (!Number.isFinite(toNumber(row[key], NaN)) || toNumber(row[key]) < 0 || toNumber(row[key]) > 100)) throw new Error("Target realisasi di luar 0–100.");
      }
    }
  }
}
