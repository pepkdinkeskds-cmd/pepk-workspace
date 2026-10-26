import { CONFIG } from "../config.js?v=0.9.7-rc4";

function csvUrl(sheetName) {
  const encoded = encodeURIComponent(sheetName);
  return `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encoded}&headers=1`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (quoted) throw new Error("CSV tidak lengkap: tanda kutip belum ditutup.");
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
  if (new Set(headers).size !== headers.length) throw new Error("Header CSV duplikat.");
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, (row[index] || "").trim()])));
}

async function fetchText(url, signal) {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "text/csv,text/plain;q=0.9,*/*;q=0.5" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Dibatalkan", "AbortError"));
    }, { once: true });
  });
}

export async function loadSheet(name, externalSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.fetchTimeoutMs);
  const onAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onAbort, { once: true });

  try {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const text = await fetchText(csvUrl(name), controller.signal);
        return decodeSheet(text, name);
      } catch (error) {
        lastError = error;
        if (controller.signal.aborted || attempt === 1) throw error;
        await wait(250, controller.signal);
      }
    }
    throw lastError;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", onAbort);
  }
}

const requiredHeaders = {
  workspaces: ["id", "title", "is_active"], resources: ["id", "title", "url", "workspace_id", "is_active"],
  quickAccess: ["resource_id", "is_active"], information: ["id", "title", "is_active"],
  agenda: ["id", "title", "date", "is_active"], realization: ["id", "is_active"],
  monevMaterials: ["material_id", "title", "file_url", "is_active"], synonyms: ["term", "synonyms", "is_active"],
  settings: ["key", "value"], searchIndex: ["id", "title", "folder_url", "is_active"]
};

export function decodeSheet(text, name) {
  if (!text.trim() || /^\s*</.test(text)) throw new Error("Sumber tidak mengembalikan CSV yang sah.");
  const rows = parseCsv(text);
  const headers = (rows[0] || []).map((h) => h.replace(/^\uFEFF/, "").trim());
  const section = Object.keys(CONFIG.sheets).find((s) => CONFIG.sheets[s] === name);
  if (!section || !requiredHeaders[section].every((h) => headers.includes(h))) throw new Error(`Struktur ${name} tidak sesuai.`);
  if (section === "realization" && ![
    ["year", "month", "financial_value", "physical_value"], ["title", "period", "value"]
  ].some((group) => group.every((h) => headers.includes(h)))) throw new Error("Struktur realisasi tidak sesuai.");
  return rowsToObjects(rows);
}

export { parseCsv, rowsToObjects };
