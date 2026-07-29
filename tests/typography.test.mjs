import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "css/main.css"), "utf8");
const pages = [
  "index.html",
  "resources.html",
  "workspace.html",
  "information.html",
  "contribute.html",
  "monev.html",
  "about.html",
  "404.html"
];

test("all pages use the Quality 03C stylesheet cache key", () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, /css\/main\.css\?v=0\.9\.5-quality-03c/);
  }
});

test("the cross-page typography scale defines every semantic level", () => {
  for (const token of [
    "--type-home-title",
    "--type-page-title",
    "--type-section-title",
    "--type-subsection-title",
    "--type-card-feature",
    "--type-card",
    "--type-card-compact",
    "--type-body",
    "--type-body-compact",
    "--type-control",
    "--type-meta",
    "--type-badge"
  ]) {
    assert.match(css, new RegExp(`${token}:`), `${token} harus tersedia`);
  }
});

test("previously undersized metadata uses the shared metadata scale", () => {
  assert.match(css, /\.year-link__detail span,[\s\S]*?font-size:\s*var\(--type-meta\)/);
  assert.match(css, /\.agenda-card__details,[\s\S]*?font-size:\s*var\(--type-meta\)/);
  assert.match(css, /\.realization-card__updated,[\s\S]*?font-size:\s*var\(--type-meta\)/);
  assert.match(css, /\.monev-material-card__file\s*\{[\s\S]*?font-size:\s*var\(--type-meta\)/);
});

test("compact badges use a readable 12px-equivalent scale", () => {
  assert.match(css, /\.application-card__meta,[\s\S]*?\.agenda-card__status,[\s\S]*?\.monev-material-card__badges span\s*\{[\s\S]*?font-size:\s*var\(--type-badge\)/);
  assert.match(css, /--type-badge:\s*\.75rem/);
});

test("chart and table labels retain explicit readable minimums", () => {
  assert.match(css, /\.realization-chart__month\s*\{[\s\S]*?font-size:\s*12px/);
  assert.match(css, /\.realization-table\s*,?[\s\S]*?font-size:\s*var\(--type-meta\)/);
});

test("the legacy Monev library description receives a final unlayered safeguard", () => {
  assert.match(
    css,
    /QUALITY 03A — final safeguard[\s\S]*?\.monev-library-access__content > span:last-child\s*\{[\s\S]*?font-size:\s*var\(--type-body-compact\)/
  );
});
