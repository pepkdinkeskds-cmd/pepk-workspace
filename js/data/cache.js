import { CONFIG } from "../config.js?v=0.9.7-rc3";
const memory = new Map();
const prefix = `pepk-public:${CONFIG.cacheSchema}:${CONFIG.spreadsheetId}:`;
function storage() { try { return globalThis.localStorage; } catch { return null; } }
export function readCache(section, now = Date.now()) {
  let record;
  try { record = memory.get(section) || JSON.parse(storage()?.getItem(prefix + section) || "null"); } catch { return null; }
  if (!record || record.schema !== CONFIG.cacheSchema || !Number.isFinite(record.savedAt) || record.savedAt > now + 60000 || record.savedAt <= 0) return null;
  if (!Array.isArray(record.value) && (section !== "settings" || !record.value || typeof record.value !== "object")) return null;
  if (Array.isArray(record.value) && !record.value.every((row) => section === "quickAccess"
    ? typeof row === "string"
    : row && typeof row === "object" && !Array.isArray(row)
      && typeof row[section === "synonyms" ? "term" : "id"] === "string")) return null;
  if (record.warnings && !Array.isArray(record.warnings)) return null;
  return { ...record, fresh: now - record.savedAt < CONFIG.cacheTtlMs };
}
export function saveCache(section, value, warnings = [], now = Date.now()) {
  const record = { schema: CONFIG.cacheSchema, savedAt: now, value, warnings };
  memory.set(section, record);
  try { storage()?.setItem(prefix + section, JSON.stringify(record)); } catch { /* Storage is optional. */ }
  return record;
}
export function clearMemoryCache() { memory.clear(); }
