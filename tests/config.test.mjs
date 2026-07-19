import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";

test("v0.6.1 uses the active Google Spreadsheet", () => {
  assert.equal(CONFIG.appVersion, "0.6.1");
  assert.equal(CONFIG.spreadsheetId, "1eEYRJmxYqqZuXABbQL2cCcKKeOt1ENk9mt_S7LgKfno");
  assert.equal(CONFIG.sheets.realization, "Realization");
});
