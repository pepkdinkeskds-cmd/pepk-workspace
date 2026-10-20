import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
// Mechanical extraction of the existing public catalog. Never seeds example metrics.
const input = process.argv[2];
if (!input) throw new Error("Usage: node tools/prepare-catalog.mjs SOURCE_LOCAL_DATA.js");
const { LOCAL_DATA: original } = await import(pathToFileURL(path.resolve(input)));
const data = structuredClone(original);
const index = data.searchIndex || [];
delete data.searchIndex;
data.groups = data.groups.map(({ id, workspaceId, title, url, icon }) => ({ id, workspaceId, title, url, icon }));
data.realization = [];
data.agenda = [];
data.monevMaterials = [];
data.settings = { ...data.settings, appVersion: "0.9.7 RC2", contentUpdatedAt: "", catalogPackagedAt: "20 Oktober 2026", serviceLinksSource: "bundled-catalog" };
delete data.settings.workflowVersion;
for (const info of data.information) {
  if (info.id === "panduan-pencarian") {
    info.summary = "Cari nama folder, aplikasi, tahun, atau jalur kerja. Pencarian tidak membaca isi berkas Drive.";
    info.content = "Gunakan kategori dan periode, misalnya DPA Pergeseran 2026 Sudah TTD. Jika ejaan dikoreksi, saran akan ditandai. Isi PDF, Word, dan spreadsheet tidak diindeks oleh portal ini.";
  }
}
await mkdir("website/js/data", { recursive: true });
await writeFile("website/js/data/local-data.js", "// Public directory seed; example agenda and metrics are deliberately excluded.\nexport const LOCAL_DATA = " + JSON.stringify(data) + ";\n");
await writeFile("website/js/data/search-index.js", "// Loaded only when searching. Bundled folder metadata, not live file contents.\nexport const BUNDLED_SEARCH_INDEX = " + JSON.stringify(index) + ";\n");
console.log(JSON.stringify({ catalogItems: data.resources.length, deepFolders: index.length, exampleMetrics: data.realization.length }));
