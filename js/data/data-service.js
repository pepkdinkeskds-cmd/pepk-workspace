import { CONFIG } from "../config.js";
import { LOCAL_DATA } from "./local-data.js";
import { loadSheet } from "./sheets.js?v=0.9.5-intent-search";

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
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
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
    if (/fisik/.test(title)) item.physicalValue = toNumber(row.value, NaN);
    if (/anggaran|keuangan/.test(title)) item.financialValue = toNumber(row.value, NaN);
    if (!item.updatedAt) item.updatedAt = normalizeDate(row.updated_at);
  });
  return [...grouped.values()].filter((item) => Number.isFinite(item.financialValue) && Number.isFinite(item.physicalValue));
}

function normalizeRealization(rows) {
  const hasMonthlySchema = rows.some((row) => row.year || row.month || row.financial_value || row.physical_value);
  const normalized = hasMonthlySchema ? normalizeMonthlyRealization(rows) : normalizeLegacyRealization(rows);
  return normalized.sort((a, b) => a.year - b.year || a.month - b.month || a.sortOrder - b.sortOrder);
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

export function getInitialData() {
  const data = clone(LOCAL_DATA);
  if (!Array.isArray(data.searchIndex)) data.searchIndex = [];
  const workspaceTitles = new Map(data.workspaces.map((item) => [item.id, item.title]));
  data.resources.forEach((item) => { item.workspaceTitle = workspaceTitleForResource(item, workspaceTitles); });
  data.validationWarnings = validateData(data);
  return data;
}


export async function refreshSettingsFromSheets() {
  const rows = await loadSheet(CONFIG.sheets.settings);
  if (!rows.length) throw new Error("Sheet Settings tidak dapat dibaca atau kosong.");
  const liveSettings = normalizeSettings(rows);
  return {
    ...clone(LOCAL_DATA.settings),
    ...liveSettings,
    serviceLinksSource: "live-sheet"
  };
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
      merged.forEach((item) => { item.workspaceTitle = workspaceTitleForResource(item, workspaceTitles); });
      data.resources = merged.sort((a, b) => a.sortOrder - b.sortOrder);
      data.groups = buildGroups(data.resources, LOCAL_DATA.groups);
      changed = true;
    }
  }

  if (loaded.searchIndex?.length) {
    const normalized = normalizeSearchIndex(loaded.searchIndex);
    if (normalized.length) {
      data.searchIndex = normalized;
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

  if (loaded.agenda?.length) {
    data.agenda = normalizeAgenda(loaded.agenda);
    changed = true;
  }

  if (loaded.realization?.length) {
    data.realization = normalizeRealization(loaded.realization);
    changed = true;
  }

  if (loaded.monevMaterials?.length) {
    data.monevMaterials = normalizeMonevMaterials(loaded.monevMaterials);
    changed = true;
  }

  if (loaded.synonyms?.length) {
    const normalized = normalizeSynonyms(loaded.synonyms);
    if (normalized.length) {
      data.synonyms = mergeMigrationSynonyms(normalized);
      changed = true;
    }
  }

  if (loaded.settings?.length) {
    data.settings = { ...data.settings, ...normalizeSettings(loaded.settings), serviceLinksSource: "live-sheet" };
    changed = true;
  }

  data.validationWarnings = validateData(data);
  const optionalSheets = new Set([CONFIG.sheets.searchIndex]);
  const failedSheets = results
    .map((result, index) => result.status === "rejected" && !optionalSheets.has(entries[index][1]) ? entries[index][1] : null)
    .filter(Boolean);

  return {
    data,
    changed,
    partialFailure: failedSheets.length > 0,
    failedSheets,
    warnings: data.validationWarnings
  };
}
