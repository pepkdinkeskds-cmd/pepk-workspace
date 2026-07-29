import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "css/main.css"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("desktop quick-service card aligns with the quick-access card", () => {
  assert.match(
    css,
    /\.home-tools-layout\s*\{[^}]*align-items:\s*stretch/
  );
  assert.match(
    css,
    /\.home-tools-card--contribution\s*\{[^}]*align-self:\s*stretch/
  );
});

test("quick-service content remains proportionally distributed", () => {
  assert.match(
    css,
    /\.home-contribution-actions\s*\{[^}]*flex:\s*1 1 auto[^}]*align-content:\s*center/
  );
  assert.match(
    home,
    /home-contribution-heading[\s\S]*?home-contribution-actions[\s\S]*?home-contribution-note/
  );
});

test("responsive quick-service action uses the available single column", () => {
  assert.match(
    css,
    /@media \(max-width:\s*68rem\)[\s\S]*?\.home-contribution-actions\s*\{[^}]*grid-template-columns:\s*1fr/
  );
});
