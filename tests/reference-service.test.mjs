import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("homepage presents Reference as the fourth submission type", async () => {
  const [home, script] = await Promise.all([
    source("index.html"),
    source("js/pages/home.js")
  ]);
  assert.match(home, /dokumen, agenda, materi monev, atau referensi melalui Submission Portal/i);
  assert.match(script, /tambahkan referensi melalui satu layanan/i);
});

test("service page explains all four submission types and Reference placement", async () => {
  const page = await source("contribute.html");
  assert.match(page, /Dokumen, Agenda, Materi Monev, dan Referensi/);
  assert.match(page, /Pilih Dokumen, Agenda, Materi Monev, atau Referensi/);
  assert.match(page, /Dokumen dan referensi dipindahkan ke folder tujuan/);
});

test("Submission Portal bridge recognizes Reference context without changing its URL", async () => {
  const bridge = await source("js/pages/submission-portal-bridge.js");
  assert.match(bridge, /reference:\s*'Buka pengajuan Referensi'/);
  assert.match(bridge, /referensi\|reference\|\\brba\\b\|\\brsb\\b\|peraturan/);
  assert.match(bridge, /script\.google\.com\/macros\/s\/AKfycbyjW1UYM2-k0AcXMrYmV36qDIL6PtJrOmOxUs4P1bhMkbpiyIEqR5_VgmMX3cdT2sM\/exec/);
});

test("every portal entry point uses the same versioned bridge", async () => {
  for (const page of ["home", "contribute", "information", "monev"]) {
    const script = await source(`js/pages/${page}.js`);
    assert.match(script, /SUBMISSION_PORTAL_URL/);
    assert.match(script, /submission-portal-bridge\.js\?v=0\.9\.5-quality-07/);
  }
});

test("all public pages load the Quality 07 cache keys", async () => {
  const pages = ["index", "resources", "workspace", "information", "contribute", "monev", "about", "404"];
  for (const page of pages) {
    const html = await source(`${page}.html`);
    assert.match(html, /css\/main\.css\?v=0\.9\.5-quality-07/);
    assert.match(html, /js\/pages\/[^"]+\.js\?v=0\.9\.5-quality-07/);
  }
});
