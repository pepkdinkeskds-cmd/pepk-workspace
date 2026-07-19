import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index.html", "resources.html", "workspace.html", "information.html", "about.html", "404.html"];

for (const page of pages) {
  const full = path.join(root, page);
  assert.ok(fs.existsSync(full), `${page} harus tersedia`);
  const html = fs.readFileSync(full, "utf8");
  assert.match(html, /<html lang="id">/);
  assert.match(html, /<main\b/);
  assert.match(html, /css\/main\.css\?v=0\.4\.1/);
  assert.doesNotMatch(html, /data-version>0\.4\.0/);
}

const localData = fs.readFileSync(path.join(root, "js/data/local-data.js"), "utf8");
assert.match(localData, /"appVersion": "0\.4\.1"/);
assert.ok(fs.existsSync(path.join(root, "manifest.webmanifest")));
console.log(`Project check lulus untuk ${pages.length} halaman.`);
