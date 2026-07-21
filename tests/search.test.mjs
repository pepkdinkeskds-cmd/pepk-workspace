import test from "node:test";
import assert from "node:assert/strict";
import { LOCAL_DATA } from "../js/data/local-data.js";
import {
  analyzeSearchIntent,
  searchResources,
  searchResourcesDetailed
} from "../js/search.js";

const searchable = [...LOCAL_DATA.resources, ...LOCAL_DATA.searchIndex];
const detailed = (query) => searchResourcesDetailed(searchable, query, LOCAL_DATA.synonyms);
const search = (query) => searchResources(searchable, query, LOCAL_DATA.synonyms);

test("exact application query returns only the exact application", () => {
  const result = detailed("Coretax");
  assert.equal(result.intent.key, "application-exact");
  assert.deepEqual(result.items.map((item) => item.resource.title), ["Coretax"]);
});

test("specific leaf query suppresses redundant RENJA parent cards", () => {
  const result = detailed("rancangan akhir renja");
  assert.equal(result.intent.key, "specific-folder");
  assert.equal(result.items.length, 6);
  assert.ok(result.items.every((item) => item.resource.kind === "deep-folder"));
  assert.ok(result.items.every((item) => item.resource.leafName === "RANCANGAN AKHIR"));
  assert.equal(result.items.some((item) => item.resource.title === "RENJA 2027"), false);
});

test("specific leaf query with year excludes other years", () => {
  const result = detailed("rancangan akhir renja 2026");
  assert.equal(result.intent.key, "specific-folder");
  assert.equal(result.items.length, 2);
  assert.ok(result.items.every((item) => item.resource.period === "2026"));
});

test("fully specified RENJA Perubahan query resolves to one folder", () => {
  const result = detailed("rancangan akhir renja perubahan 2026");
  assert.equal(result.items.length, 1);
  assert.match(result.items[0].resource.path, /RENJA PERUBAHAN.*2026.*RANCANGAN AKHIR/);
});

test("parent plus year shows the parent followed by its deepest children", () => {
  const result = detailed("renja 2026");
  assert.equal(result.intent.key, "parent-year");
  assert.equal(result.items[0].resource.title, "RENJA 2026");
  assert.equal(result.items[0].resource.searchRole, "parent");
  assert.deepEqual(
    result.items.slice(1).map((item) => item.resource.leafName).sort(),
    ["DATA PENDUKUNG", "RANCANGAN AKHIR", "RANCANGAN AWAL"]
  );
});

test("parent without year shows yearly parent folders but not deep children", () => {
  const result = detailed("renja");
  assert.equal(result.intent.key, "parent");
  assert.equal(result.items.length, 6);
  assert.ok(result.items.every((item) => item.resource.kind !== "deep-folder"));
  assert.ok(result.items.some((item) => item.resource.title === "RENJA PERUBAHAN 2027"));
});

test("intermediate path qualifier opens only deepest folders under that branch", () => {
  const result = detailed("dpa pergeseran 2026");
  assert.equal(result.intent.key, "path-specific");
  assert.equal(result.items.length, 2);
  assert.ok(result.items.every((item) => /PERGESERAN/.test(item.resource.path)));
  assert.ok(result.items.every((item) => item.resource.kind === "deep-folder"));
});

test("general DPA year query expands all deepest DPA folders", () => {
  const result = detailed("dpa 2026");
  assert.equal(result.intent.key, "parent-year");
  assert.equal(result.items[0].resource.title, "DPA 2026");
  assert.equal(result.items.length, 7);
});

test("BAHAN RAKOR remains a direct searchable container", () => {
  const result = detailed("bahan rakor");
  assert.equal(result.intent.key, "specific-folder");
  assert.deepEqual(result.items.map((item) => item.resource.period), ["2027", "2026", "2025"]);
});

test("BAHAN RAKOR year query returns only the requested year", () => {
  const result = detailed("bahan rakor 2026");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].resource.period, "2026");
  assert.equal(result.items[0].resource.leafName, "BAHAN RAKOR");
});

test("multi-year parent resources remain searchable by an included year", () => {
  const result = detailed("renstra 2026");
  assert.equal(result.intent.key, "parent-year");
  assert.ok(result.items.some((item) => item.resource.id === "perencanaan-renstra-2025-2029"));
  assert.ok(result.items.every((item) => item.resource.kind !== "deep-folder"));
});

test("specific reference query does not add unrelated parent cards", () => {
  const results = search("Peraturan Kudus");
  assert.equal(results.length, 1);
  assert.equal(results[0].workspaceId, "document-center");
  assert.match(results[0].title, /PERATURAN KUDUS/i);
});

test("natural language stop words are ignored", () => {
  const result = detailed("saya mencari rancangan akhir renja tahun 2026");
  assert.equal(result.intent.key, "specific-folder");
  assert.equal(result.items.length, 2);
  assert.ok(result.items.every((item) => item.resource.period === "2026"));
});

test("simple typo correction is used only as a fallback", () => {
  const result = detailed("rancagan akhir renja");
  assert.equal(result.intent.key, "fuzzy-folder");
  assert.equal(result.items.length, 6);
  assert.ok(result.items.every((item) => item.resource.leafName === "RANCANGAN AKHIR"));
});

test("intent analysis exposes a user-facing guidance string", () => {
  const intent = analyzeSearchIntent(searchable, "rancangan akhir renja", LOCAL_DATA.synonyms);
  assert.equal(intent.directOnly, true);
  assert.match(intent.guidance, /kartu induk disembunyikan/i);
});

test("unknown query returns no result", () => {
  assert.equal(search("zzzz-resource-tidak-ada").length, 0);
});
