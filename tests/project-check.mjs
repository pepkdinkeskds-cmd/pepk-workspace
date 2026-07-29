import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const pages = ["index.html", "resources.html", "workspace.html", "information.html", "contribute.html",
  "monev.html", "about.html", "404.html"];

for (const page of pages) {
  const full = path.join(root, page);
  assert.ok(fs.existsSync(full), `${page} harus tersedia`);
  const html = fs.readFileSync(full, "utf8");
  assert.match(html, /<html lang="id">/);
  assert.match(html, /<main\b/);
  assert.match(html, /css\/main\.css\?v=0\.9\.5\-(?:intent-search|service-hub-02|service-hub-03|service-hub-04|service-hub-06|quality-01)/);
  assert.match(html, /href="contribute\.html(?:\?[^"]*)?">Layanan<\/a>/);
}

const homeHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeScript = fs.readFileSync(path.join(root, "js/pages/home.js"), "utf8");
assert.match(homeHtml, /Satu pintu pengajuan PEPK/);
assert.match(homeHtml, /tautan unik yang dikirim ke email pengirim/);
assert.match(homeScript, /Mulai Pengajuan/);
assert.match(homeScript, /button button--primary contribution-quick-card__action/);
assert.match(read("resources.html"), /class="monev-library-access" href="monev\.html"/);
const mainCss = read("css/main.css");
assert.match(mainCss, /Service Hub 06 — quiet text actions/);
assert.match(mainCss, /\.monev-library-access__action\s*\{[\s\S]*?background:\s*transparent/);
assert.match(mainCss, /contribution-action-card__end--action,[\s\S]*?background:\s*transparent/);
assert.match(read("resources.html"), /Buka daftar Materi Monev/);
assert.match(homeScript, /script\.google\.com\/macros\/s\//);
assert.doesNotMatch(homeScript, /Buka formulir/);
assert.doesNotMatch(homeScript, /title:\s*"Tambah Agenda"/);

const monevHtml = read("monev.html");
const monevScript = read("js/pages/monev.js");
const informationHtml = read("information.html");
const informationScript = read("js/pages/information.js");
assert.match(monevScript, /initApp\("resources"\)/);
assert.match(monevScript, /SUBMISSION_PORTAL_URL/);
assert.match(monevHtml, /Ajukan Materi Monev/);
assert.match(informationHtml, /Ajukan Agenda/);
assert.match(informationScript, /SUBMISSION_PORTAL_URL/);
assert.doesNotMatch(monevHtml, /Unggah Materi/);
assert.doesNotMatch(informationHtml, /Tambah agenda/i);
assert.doesNotMatch(`${monevHtml}\n${monevScript}\n${informationHtml}\n${informationScript}`, /docs\.google\.com\/forms|forms\.gle/);
for (const page of pages) {
  assert.doesNotMatch(read(page), /<h[1-6][^>]*>\s*<\/h[1-6]>/i, `${page} tidak boleh memiliki heading kosong`);
}

const contributeHtml = fs.readFileSync(path.join(root, "contribute.html"), "utf8");
const contributeScript = fs.readFileSync(path.join(root, "js/pages/contribute.js"), "utf8");
assert.match(contributeHtml, /Satu pintu untuk pengajuan Dokumen, Agenda, dan Materi Monev/);
assert.match(contributeScript, /title:\s*"Mulai Pengajuan PEPK"/);
assert.match(contributeScript, /title:\s*"Pantau melalui email"/);
assert.match(contributeScript, /SUBMISSION_PORTAL_URL/);
assert.doesNotMatch(contributeScript, /documentUploadFormUrl|agendaSubmitFormUrl|monevMaterialFormUrl/);

const localData = fs.readFileSync(path.join(root, "js/data/local-data.js"), "utf8");
assert.match(localData, /"appVersion": "0.9.5"/);
assert.match(localData, /"workspaceGeneration": "V2"/);
assert.match(localData, /"workspaceId": "document-center"/);

const workflowScript = fs.readFileSync(path.join(root, "apps-script/pepk-workflow/Code.gs"), "utf8");
assert.match(workflowScript, /VERSION: '2\.3\.1'/);
assert.match(workflowScript, /FOLDER_INDEX/);
assert.match(workflowScript, /function syncUploadRoutes/);
assert.match(workflowScript, /function setupMonevWorkflow/);

assert.ok(fs.existsSync(path.join(root, "docs/PEPK_Workspace_Data_V2_RC.xlsx")));
assert.ok(fs.existsSync(path.join(root, "docs/CUTOVER-V2-RC.md")));
assert.ok(fs.existsSync(path.join(root, "docs/WEBSITE-V0.9.0-RC.md")));

const appLogoDir = path.join(root, "assets/apps");
const webpLogos = fs.readdirSync(appLogoDir).filter((name) => name.endsWith(".webp"));
assert.equal(webpLogos.length, 19);

console.log(`Project check lulus untuk ${pages.length} halaman dan ${webpLogos.length} logo aplikasi.`);

const workspacePageScript = fs.readFileSync(path.join(root, "js/pages/workspace.js"), "utf8");
assert.match(workspacePageScript, /id:\s*"document-center"/);
assert.match(workspacePageScript, /title:\s*"Referensi"/);
assert.match(workspacePageScript, /referenceGroups/);
assert.match(fs.readFileSync(path.join(root, "workspace.html"), "utf8"), /data-workspace-documents-heading/);

assert.match(localData, /"searchIndex": \[/);
assert.match(localData, /"kind": "deep-folder"/);
assert.match(workflowScript, /SEARCH_INDEX/);
assert.match(workflowScript, /function syncDeepSearchIndex/);
assert.match(workflowScript, /function rebuildDeepSearchIndex_/);
assert.ok(fs.existsSync(path.join(root, "docs/DEEP-SEARCH-v0.9.4.md")));
assert.ok(fs.existsSync(path.join(root, "docs/INTENT-AWARE-SEARCH-v0.9.5.md")));
const searchScript = fs.readFileSync(path.join(root, "js/search.js"), "utf8");
assert.match(searchScript, /function deriveStructuralIntent/);
assert.match(searchScript, /export function searchResourcesDetailed/);
assert.match(searchScript, /export function analyzeSearchIntent/);
assert.match(searchScript, /function fuzzyDirectResults/);
