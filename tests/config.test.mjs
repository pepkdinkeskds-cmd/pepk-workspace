import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";

test("v0.9.4 uses the V2 Google Spreadsheet", () => {
  assert.equal(CONFIG.appVersion, "0.9.4");
  assert.equal(CONFIG.spreadsheetId, "1rSbyazj5MSdRYHgBYLBA7jeMjYKattvRPCG9SKHSxCM");
  assert.equal(CONFIG.sheets.realization, "Realization");
  assert.equal(CONFIG.sheets.monevMaterials, "Monev_Materials");
  assert.equal(CONFIG.sheets.searchIndex, "Search_Index");
});
