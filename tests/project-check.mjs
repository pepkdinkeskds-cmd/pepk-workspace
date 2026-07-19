import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "resources.html", "workspace.html", "information.html", "contribute.html",
  "monev.html", "about.html", "404.html"];

for (const page of pages) {
  const full = path.join(root, page);
  assert.ok(fs.existsSync(full), `${page} harus tersedia`);
  const html = fs.readFileSync(full, "utf8");
  assert.match(html, /<html lang="id">/);
  assert.match(html, /<main\b/);
  assert.match(html, /css\/main\.css\?v=0\.7\.5-home-spacing/);
  assert.match(html, /contribute\.html/);
  assert.match(html, /href="contribute\.html(?:\?[^"]*)?">Layanan<\/a>/);
}

const servicePage = fs.readFileSync(path.join(root, "contribute.html"), "utf8");
assert.match(servicePage, /<title>Layanan — PEPK Workspace<\/title>/);
assert.match(servicePage, /<h1>Pusat Layanan PEPK<\/h1>/);

const localData = fs.readFileSync(path.join(root, "js/data/local-data.js"), "utf8");
assert.match(localData, /"appVersion": "0\.7\.5"/);
assert.match(localData, /"workflowEnabled": true/);
assert.ok(fs.existsSync(path.join(root, "manifest.webmanifest")));
assert.ok(fs.existsSync(path.join(root, "apps-script/pepk-workflow/Code.gs")));
assert.ok(fs.existsSync(path.join(root, "docs/WORKFLOW-SETUP.md")));
assert.ok(fs.existsSync(path.join(root, "docs/WORKFLOW-ROUTING-v0.6.1.md")));

const workflowScript = fs.readFileSync(path.join(root, "apps-script/pepk-workflow/Code.gs"), "utf8");
assert.match(workflowScript, /VERSION: '0\.7\.0'/);
assert.match(workflowScript, /function syncUploadRoutes/);
assert.match(workflowScript, /function repairAgendaIds/);
assert.match(workflowScript, /function testWorkflowConfiguration/);
assert.match(workflowScript, /function setupMonevWorkflow/);
assert.match(workflowScript, /MONEV_MATERIALS/);

const appLogoDir = path.join(root, "assets/apps");
const webpLogos = fs.readdirSync(appLogoDir).filter((name) => name.endsWith(".webp"));
assert.equal(webpLogos.length, 19);

console.log(`Project check lulus untuk ${pages.length} halaman dan ${webpLogos.length} logo aplikasi.`);
