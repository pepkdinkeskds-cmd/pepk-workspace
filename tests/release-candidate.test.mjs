import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../js/config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index", "resources", "workspace", "information", "contribute", "monev", "about", "404"];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("RC1 version is consistent across package, runtime, fallback, and Feedback", () => {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.version, "0.9.6-rc.1");
  assert.equal(CONFIG.appVersion, "0.9.6 RC1");
  assert.match(read("js/data/local-data.js"), /"appVersion": "0.9.6 RC1"/);
  assert.match(read("js/feedback.js"), /appVersion:\s*"0.9.6 RC1"/);
});

test("all public pages expose RC1 and load only the RC1 website cache key", () => {
  for (const page of pages) {
    const html = read(`${page}.html`);
    assert.match(html, /data-version>0\.9\.6 RC1<\/span>/);
    assert.match(html, /css\/main\.css\?v=0\.9\.6-rc1/);
    assert.match(html, /js\/mobile-nav\.js\?v=0\.9\.6-rc1/);
    assert.match(html, /js\/pages\/[^"]+\.js\?v=0\.9\.6-rc1/);
    assert.match(html, /js\/feedback\.js\?v=0\.9\.6-rc1/);
    assert.doesNotMatch(html, /\?v=0\.9\.5-/);
  }
});

test("active JavaScript imports no stale v0.9.5 cache keys", () => {
  const stack = [path.join(root, "js")];
  while (stack.length) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      if (entry.isFile() && entry.name.endsWith(".js")) {
        assert.doesNotMatch(fs.readFileSync(fullPath, "utf8"), /\?v=0\.9\.5-/);
      }
    }
  }
});

test("locked Submission Portal and mobile behavior remain enabled", () => {
  const bridge = read("js/pages/submission-portal-bridge.js");
  const mobileNav = read("js/mobile-nav.js");
  assert.match(bridge, /AKfycbyjW1UYM2-k0AcXMrYmV36qDIL6PtJrOmOxUs4P1bhMkbpiyIEqR5_VgmMX3cdT2sM\/exec/);
  assert.match(bridge, /anchor\.removeAttribute\('target'\)/);
  assert.match(mobileNav, /menuButton\.addEventListener\("click"/);
  assert.ok(mobileNav.length < 5000);
});

test("RC1 documents the active version matrix and strict scope", () => {
  const guide = read("PANDUAN_RILIS_v0.9.6_RC1.md");
  assert.match(guide, /Operator Console \| `1\.0\.0\.2 \+ FEEDBACK_OPERATOR_PILOT_01`/);
  assert.match(guide, /Submission Portal \| `0\.2\.2\.1-beta`/);
  assert.match(guide, /Workflow \| `2\.4\.0\.1`/);
  assert.match(guide, /Notification Delivery \| `0\.9\.9\.1\.2-beta`/);
  assert.match(guide, /Jangan mengganti:/);
});

test("staff pilot keeps feature requests out of RC1 and maps future work", () => {
  const pilot = read("PANDUAN_PILOT_STAF_v0.9.6_RC1.md");
  assert.match(pilot, /\[RC1-FIX\]/);
  assert.match(pilot, /\[V1-IMPROVEMENT\]/);
  assert.match(pilot, /\[V2-CANDIDATE\]/);
  assert.match(pilot, /\[NOT-PLANNED\]/);
  assert.match(pilot, /Permintaan fitur tidak langsung dimasukkan ke RC1/);
});
