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

function relativeLuminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(left, right) {
  const values = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("every page has a keyboard-focusable skip target", async () => {
  for (const page of pages) {
    const html = await source(`${page}.html`);
    assert.match(html, /<a class="skip-link" href="#main-content">/);
    assert.match(html, /<main\b[^>]*id="main-content"[^>]*tabindex="-1"|<main\b[^>]*tabindex="-1"[^>]*id="main-content"/);
  }
});

test("skip navigation transfers focus to the main content", async () => {
  const app = await source("js/app.js");
  assert.match(app, /function initSkipLink\(\)/);
  assert.match(app, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(app, /initSkipLink\(\);\s*initMobileMenu\(\);/);
});

test("mobile navigation closes with Escape and after leaving the mobile breakpoint", async () => {
  const app = await source("js/app.js");
  assert.match(app, /event\.key === "Escape"/);
  assert.match(app, /menuButton\.focus\(\)/);
  assert.match(app, /matchMedia\("\(max-width: 52rem\)"\)/);
  assert.match(app, /if \(!event\.matches\) setOpen\(false\)/);
});

test("search fields identify the result regions they update", async () => {
  const home = await source("index.html");
  const resources = await source("resources.html");
  const workspace = await source("workspace.html");
  const monev = await source("monev.html");
  assert.match(home, /data-home-search[^>]*aria-controls="home-search-results"/);
  assert.match(home, /id="home-search-results"/);
  assert.match(resources, /data-resource-search[^>]*aria-controls="resource-results"/);
  assert.match(resources, /id="resource-results"/);
  assert.match(workspace, /data-workspace-search[^>]*aria-controls="workspace-app-results workspace-document-groups"/);
  assert.match(monev, /id="monev-search"[^>]*aria-controls="monev-results"/);
  assert.match(monev, /data-monev-result-count aria-live="polite"/);
});

test("status details are included in the accessible name", async () => {
  const app = await source("js/app.js");
  assert.match(app, /node\.setAttribute\("aria-label", detail \? `\$\{message\}\. \$\{detail\}` : message\)/);
});

test("portal links retain a clear new-tab announcement", async () => {
  for (const page of ["home", "contribute"]) {
    const script = await source(`js/pages/${page}.js`);
    assert.match(script, /Submission Portal — terbuka di tab baru/);
  }
});

test("motion preferences disable smooth scrolling and transitions", async () => {
  const css = await source("css/main.css");
  assert.match(css, /QUALITY 06 — accessible focus, contrast, and motion preferences/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scroll-behavior:\s*auto/);
  assert.match(css, /transition-duration:\s*\.01ms/);
});

test("secondary text color meets normal-text contrast on light surfaces", async () => {
  const css = await source("css/main.css");
  const match = css.match(/--ink-500:\s*(#[0-9a-f]{6})/i);
  assert.ok(match, "token --ink-500 harus tersedia");
  assert.ok(contrast(match[1], "#ffffff") >= 4.5);
  assert.ok(contrast(match[1], "#f6f8fa") >= 4.5);
});
