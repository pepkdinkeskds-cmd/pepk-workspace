import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";

test("v0.7.0 uses the active Google Spreadsheet", () => {
  assert.equal(CONFIG.appVersion, "0.7.0");
  assert.equal(CONFIG.spreadsheetId, "1eEYRJmxYqqZuXABbQL2cCcKKeOt1ENk9mt_S7LgKfno");
  assert.equal(CONFIG.sheets.realization, "Realization");
  assert.equal(CONFIG.sheets.monevMaterials, "Monev_Materials");
});
