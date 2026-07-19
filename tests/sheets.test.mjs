import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, rowsToObjects } from "../js/data/sheets.js";

test("CSV parser handles quoted commas and escaped quotes", () => {
  const csv = 'id,title,description\n1,"RENJA, 2026","Data ""awal"" dan akhir"\n';
  const rows = parseCsv(csv);
  assert.equal(rows[1][1], "RENJA, 2026");
  assert.equal(rows[1][2], 'Data "awal" dan akhir');
});

test("rows are mapped using the first row as headers", () => {
  const objects = rowsToObjects([["id", "title"], ["1", "RENJA"]]);
  assert.deepEqual(objects, [{ id: "1", title: "RENJA" }]);
});


test("Google Sheets CSV URL forces exactly one header row", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../js/data/sheets.js", import.meta.url), "utf8"));
  assert.match(source, /&headers=1/);
});
