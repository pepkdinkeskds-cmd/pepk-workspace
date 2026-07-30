import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageModules = ["home", "resources", "workspace", "information", "monev", "about", "contribute"];
const htmlPages = ["index", "resources", "workspace", "information", "monev", "about", "contribute", "404"];

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("all active page modules retain the shared status language", async () => {
  for (const page of pageModules) {
    const content = await source(`js/pages/${page}.js`);
    assert.match(content, /status\.js\?v=0\.9\.5-quality-05/, `${page}.js must load the shared status module`);
    assert.doesNotMatch(content, /setDataStatus\(/, `${page}.js must not define its own status wording`);
  }
});

test("shared status module uses user-facing language and accessible semantics", async () => {
  const content = await source("js/status.js");
  assert.match(content, /Memperbarui konten…/);
  assert.match(content, /Konten tersimpan aktif/);
  assert.match(content, /role", "status"/);
  assert.match(content, /aria-live", "polite"/);
  assert.match(content, /aria-atomic", "true"/);
  assert.doesNotMatch(content, /Google Sheets|Data lokal|data bawaan|failedSheets/);
});

test("user-facing states do not expose internal data implementation", async () => {
  const files = [
    ...pageModules.map((page) => `js/pages/${page}.js`),
    ...htmlPages.map((page) => `${page}.html`)
  ];
  const combined = (await Promise.all(files.map(source))).join("\n");
  assert.doesNotMatch(combined, /Google Sheets|Data lokal|data bawaan|sheet Agenda|sheet Realization|Data tersinkron|Memeriksa pembaruan/);
  assert.doesNotMatch(combined, />Search-first<|Metadata resource|source code aplikasi|disetujui administrator/);
});

test("changed pages load the Quality 05 module cache key", async () => {
  for (const page of htmlPages) {
    const content = await source(`${page}.html`);
    assert.match(content, /js\/pages\/[^"]+\.js\?v=0\.9\.5-quality-05/, `${page}.html must use the Quality 05 page-module cache key`);
  }
});

test("empty states use operational wording", async () => {
  const home = await source("js/pages/home.js");
  const resources = await source("js/pages/resources.js");
  const workspace = await source("js/pages/workspace.js");
  const monev = await source("js/pages/monev.js");
  assert.match(home, /dipublikasikan oleh operator/);
  assert.match(home, /periode terbaru dipublikasikan/);
  assert.match(resources, /Dokumen atau aplikasi belum ditemukan/);
  assert.match(workspace, /Dokumen atau aplikasi belum ditemukan/);
  assert.match(monev, /disetujui operator/);
  assert.match(monev, /ajukan Materi Monev melalui Layanan/);
});
