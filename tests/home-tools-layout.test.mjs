import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "css/main.css"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeScript = fs.readFileSync(path.join(root, "js/pages/home.js"), "utf8");

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

test("submission description is no longer truncated", () => {
  assert.match(
    css,
    /\.home-contribution-actions \.contribution-quick-card__content p\s*\{[^}]*display:\s*block[^}]*overflow:\s*visible[^}]*-webkit-line-clamp:\s*unset/
  );
  assert.match(
    homeScript,
    /Unggah dokumen, ajukan agenda, kirim materi monev, atau tambahkan referensi melalui satu layanan\./
  );
});

test("submission card is enlarged without dominating the service panel", () => {
  assert.match(
    css,
    /\.home-contribution-actions \.contribution-quick-card\s*\{[^}]*min-height:\s*10\.5rem[^}]*padding:\s*1rem/
  );
  assert.match(
    css,
    /@media \(max-width:\s*40rem\)[\s\S]*?\.home-contribution-actions \.contribution-quick-card\s*\{[^}]*min-height:\s*10rem/
  );
});

test("service heading uses more of the available vertical space", () => {
  assert.match(
    css,
    /\.home-contribution-heading p\s*\{[^}]*margin-block-start:\s*clamp\(\.85rem,\s*1\.4vw,\s*1\.1rem\)/
  );
});
