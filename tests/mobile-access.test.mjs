import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index", "resources", "workspace", "information", "contribute", "monev", "about", "404"];

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("the mobile menu bootstrap is independent from heavy page modules", async () => {
  const script = await source("js/mobile-nav.js");
  assert.doesNotMatch(script, /^\s*import\s/m);
  assert.match(script, /dataset\.mobileMenuReady/);
  assert.match(script, /menuButton\.addEventListener\("click"/);
  assert.match(script, /event\.preventDefault\(\)/);
  assert.match(script, /matchMedia\(MOBILE_QUERY\)/);
  assert.ok(script.length < 5000, "bootstrap navigasi harus tetap ringan");
});

test("one tap opens the mobile menu", async () => {
  const script = await source("js/mobile-nav.js");
  const attributes = new Map([["aria-expanded", "false"]]);
  const listeners = new Map();
  const menuButton = {
    dataset: {},
    innerHTML: "",
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name); },
    addEventListener(name, handler) { listeners.set(name, handler); },
    contains(target) { return target === this; },
    focus() {}
  };
  const menu = {
    hidden: true,
    contains() { return false; },
    querySelectorAll() { return []; }
  };
  const documentListeners = new Map();
  const document = {
    readyState: "complete",
    querySelector(selector) {
      if (selector === "[data-menu-button]") return menuButton;
      if (selector === "[data-mobile-nav]") return menu;
      return null;
    },
    addEventListener(name, handler) { documentListeners.set(name, handler); }
  };
  const window = {
    matchMedia() {
      return { addEventListener() {} };
    }
  };

  vm.runInNewContext(script, { document, window });
  assert.equal(typeof listeners.get("click"), "function");
  listeners.get("click")({ preventDefault() {} });
  assert.equal(attributes.get("aria-expanded"), "true");
  assert.equal(menu.hidden, false);
});

test("every page starts the mobile menu before its page module", async () => {
  for (const page of pages) {
    const html = await source(`${page}.html`);
    const shellIndex = html.indexOf('js/mobile-nav.js?v=0.9.5-mobile-access-01');
    const pageIndex = html.search(/js\/pages\/[^"]+\.js\?v=0\.9\.5-mobile-access-01/);
    assert.ok(shellIndex >= 0, `${page}.html harus memuat bootstrap navigasi`);
    assert.ok(pageIndex > shellIndex, `${page}.html harus memuat bootstrap sebelum modul halaman`);
  }
});

test("the shared app refuses to attach a duplicate mobile-menu handler", async () => {
  const app = await source("js/app.js");
  assert.match(app, /if \(menuButton\.dataset\.mobileMenuReady === "true"\) return/);
  assert.match(app, /menuButton\.dataset\.mobileMenuReady = "true"/);
});

test("Submission Portal navigation stays in the current tab", async () => {
  const bridge = await source("js/pages/submission-portal-bridge.js");
  assert.match(bridge, /export function configureSubmissionLink/);
  assert.match(bridge, /anchor\.removeAttribute\('target'\)/);
  assert.match(bridge, /anchor\.removeAttribute\('rel'\)/);
  assert.match(bridge, /di halaman ini/);
  assert.doesNotMatch(bridge, /anchor\.target = '_blank'/);

  const monev = await source("monev.html");
  const monevLink = monev.match(/<a class="button button--primary button--small" data-monev-upload-link[\s\S]*?<\/a>/)?.[0] || "";
  assert.doesNotMatch(monevLink, /target="_blank"/);
});

test("the hamburger has a reliable touch target", async () => {
  const css = await source("css/main.css");
  assert.match(css, /\.menu-button\s*\{[\s\S]*?width:\s*3\.25rem/);
  assert.match(css, /\.menu-button\s*\{[\s\S]*?height:\s*3\.25rem/);
  assert.match(css, /\.menu-button\s*\{[\s\S]*?touch-action:\s*manipulation/);
  assert.match(css, /\.menu-button \.icon,[\s\S]*?pointer-events:\s*none/);
});
