import test from "node:test";
import assert from "node:assert/strict";
import { LOCAL_DATA } from "../js/data/local-data.js";
import { searchResources } from "../js/search.js";

const search = (query) => searchResources(LOCAL_DATA.resources, query, LOCAL_DATA.synonyms);

test("exact application title ranks first", () => {
  const results = search("Coretax");
  assert.ok(results.length > 0);
  assert.equal(results[0].title, "Coretax");
});

test("subfolder keyword and year find the correct document folder", () => {
  const results = search("Renja Akhir 2026");
  assert.ok(results.length > 0);
  assert.equal(results[0].category, "RENJA");
  assert.equal(results[0].year, 2026);
});

test("synonym finds a resource", () => {
  const results = search("laporan kinerja 2026");
  assert.ok(results.some((item) => item.year === 2026));
});

test("partial word with at least four characters is supported", () => {
  const results = search("perencana");
  assert.ok(results.length > 0);
  assert.ok(results.some((item) => item.workspaceId === "perencanaan"));
});

test("unknown query returns no result", () => {
  assert.equal(search("zzzz-resource-tidak-ada").length, 0);
});
