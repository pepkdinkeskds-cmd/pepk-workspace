import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function collectJavaScript(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScript(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

test("all browser JavaScript files pass syntax validation", () => {
  const files = collectJavaScript(path.join(root, "js"));
  assert.ok(files.length > 0);
  for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    assert.equal(result.status, 0, `${path.relative(root, file)}\n${result.stderr}`);
  }
});

test("source code contains no duplicate export token", () => {
  const files = collectJavaScript(path.join(root, "js"));
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /\bexport\s+export\b/);
  }
});
