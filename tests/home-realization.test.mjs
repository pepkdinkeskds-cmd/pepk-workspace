import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const homeHtml = read("index.html");
const homeScript = read("js/pages/home.js");
const uiScript = read("js/ui.js");
const css = read("css/main.css");

test("homepage realization introduces trend and evaluation hierarchy", () => {
  assert.match(homeHtml, /Tren realisasi dan evaluasi bulan terbaru/);
  assert.match(homeScript, /realizationOverviewCard\(data\.realization/);
  assert.doesNotMatch(homeScript, /realizationCard\(item/);
});

test("overview is one card with a 62:38 desktop composition", () => {
  assert.match(uiScript, /className:\s*"realization-overview"/);
  assert.match(css, /\.realization-overview\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.62fr\)\s+minmax\(18rem,\s*1fr\)/);
  assert.match(css, /\.realization-overview__summary\s*\{[\s\S]*?border-inline-start:/);
});

test("compact chart only plots through the latest available month", () => {
  assert.match(uiScript, /realizationChart\(yearItems,\s*latest\.year,\s*\{\s*compact:\s*true,\s*throughMonth\s*\}\)/);
  assert.match(uiScript, /length:\s*visibleMonthCount/);
  assert.match(uiScript, /month <= visibleMonthCount/);
});

test("right summary keeps financial, physical, and evaluation in order", () => {
  const financial = uiScript.indexOf('metricProgress("Realisasi Keuangan"');
  const physical = uiScript.indexOf('metricProgress("Realisasi Fisik"');
  const evaluation = uiScript.indexOf('className: `realization-evaluation');
  assert.ok(financial >= 0 && physical > financial && evaluation > physical);
});

test("tablet and mobile layouts stack without changing data logic", () => {
  assert.match(css, /@media \(max-width:\s*64rem\)[\s\S]*?\.realization-overview[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width:\s*40rem\)[\s\S]*?\.realization-overview__summary[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /\.realization-overview \.realization-chart__svg\s*\{[\s\S]*?min-width:\s*100%/);
  assert.match(css, /\.realization-overview \.realization-chart__month\s*\{[\s\S]*?font-size:\s*26px/);
});
