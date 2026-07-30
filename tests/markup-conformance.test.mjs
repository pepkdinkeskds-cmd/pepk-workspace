import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index", "resources", "workspace", "information", "contribute", "monev", "about", "404"];

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("every page uses the canonical HTML doctype", async () => {
  for (const page of pages) {
    assert.match(await source(`${page}.html`), /^<!DOCTYPE html>/);
  }
});

test("labelled generic summary containers expose an explicit group role", async () => {
  const [home, workspace, monev, about] = await Promise.all([
    source("index.html"),
    source("workspace.html"),
    source("monev.html"),
    source("about.html")
  ]);
  assert.match(home, /class="search-hints"[^>]*role="group"[^>]*aria-label="Contoh pencarian"/);
  assert.match(workspace, /data-workspace-stats[^>]*role="group"[^>]*aria-label="Ringkasan ruang kerja"/);
  assert.match(monev, /data-monev-summary[^>]*role="group"[^>]*aria-label="Ringkasan materi Monev"/);
  assert.match(about, /class="system-summary"[^>]*role="group"[^>]*aria-label="Ringkasan konten"/);
});

test("filter forms provide explicit submit controls", async () => {
  for (const page of ["resources", "monev"]) {
    const html = await source(`${page}.html`);
    assert.match(html, /class="filter-actions"[\s\S]*?<button[^>]*type="submit"[^>]*>Terapkan<\/button>/);
  }
});

test("Monev search describes and controls its live results", async () => {
  const html = await source("monev.html");
  assert.match(html, /id="monev-search"[^>]*aria-controls="monev-results"[^>]*aria-describedby="monev-results-summary"/);
  assert.match(html, /id="monev-results-summary"/);
});

test("Monev submit applies filters without navigating away", async () => {
  const script = await source("js/pages/monev.js");
  assert.match(script, /form\.addEventListener\("submit", \(event\) => \{\s*event\.preventDefault\(\);\s*syncState\(\);/);
});

test("presentation order uses readable text instead of ARIA on a generic span", async () => {
  const script = await source("js/pages/monev.js");
  assert.match(script, /className: "sr-only", text: "Urutan presentasi "/);
  assert.doesNotMatch(script, /monev-material-card__order"[^}\n]*"aria-label"/);
});

test("filter actions remain usable at narrow breakpoints", async () => {
  const css = await source("css/main.css");
  assert.match(css, /\.filter-actions\s*\{[\s\S]*?display:\s*flex/);
  assert.match(css, /\.filter-actions \.button\s*\{[\s\S]*?flex:\s*1 1 0/);
});
