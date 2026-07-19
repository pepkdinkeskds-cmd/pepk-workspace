import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";

test("v0.4.1 uses the replacement Google Spreadsheet", () => {
  assert.equal(CONFIG.appVersion, "0.4.1");
  assert.equal(CONFIG.spreadsheetId, "1eEYRJmxYqqZuXABbQL2cCcKKeOt1ENk9mt_S7LgKfno");
  assert.equal(CONFIG.sheets.agenda, "Agenda");
  assert.equal(CONFIG.sheets.realization, "Realization");
});
