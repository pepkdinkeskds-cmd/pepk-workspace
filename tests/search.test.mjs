import test from "node:test";
import assert from "node:assert/strict";
import { LOCAL_DATA } from "../js/data/local-data.js";
import { searchResources } from "../js/search.js";

const searchable = [...LOCAL_DATA.resources, ...LOCAL_DATA.searchIndex];
const search = (query) => searchResources(searchable, query, LOCAL_DATA.synonyms);

test("exact application title ranks first", () => {
  const results = search("Coretax");
  assert.ok(results.length > 0);
  assert.equal(results[0].title, "Coretax");
});

test("BAHAN RAKOR direct folders rank above yearly parent resources", () => {
  const results = search("bahan rakor");
  assert.ok(results.length >= 3);
  assert.ok(results.slice(0, 3).every((item) => item.kind === "deep-folder"));
  assert.deepEqual(results.slice(0, 3).map((item) => item.period), ["2027", "2026", "2025"]);
});

test("year narrows a direct BAHAN RAKOR result", () => {
  const results = search("bahan rakor 2026");
  assert.equal(results[0].kind, "deep-folder");
  assert.equal(results[0].leafName, "BAHAN RAKOR");
  assert.equal(results[0].period, "2026");
});

test("DPA pergeseran can open a deepest folder directly", () => {
  const results = search("dpa pergeseran 2026");
  assert.ok(results.length > 0);
  assert.equal(results[0].kind, "deep-folder");
  assert.match(results[0].path.toLowerCase(), /dpa/);
  assert.match(results[0].path.toLowerCase(), /pergeseran/);
  assert.equal(results[0].period, "2026");
});

test("a year inside a multi-year period remains searchable", () => {
  const results = search("RENSTRA 2026");
  assert.ok(results.some((item) => item.id === "perencanaan-renstra-2025-2029"));
});

test("Document Center reference leaf folders are searchable", () => {
  const results = search("Peraturan Kudus");
  assert.ok(results.some((item) => item.workspaceId === "document-center"));
});

test("unknown query returns no result", () => {
  assert.equal(search("zzzz-resource-tidak-ada").length, 0);
});
