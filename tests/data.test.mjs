import test from "node:test";
import assert from "node:assert/strict";
import { getInitialData, validateData } from "../js/data/data-service.js";

const data = getInitialData();

test("local data keeps four visual workspaces", () => {
  assert.equal(data.workspaces.length, 4);
});

test("Document Center appears as reference, not a fifth workspace", () => {
  const references = data.resources.filter((item) => item.scope === "reference");
  assert.ok(references.length > 0);
  assert.ok(references.every((item) => item.workspaceTitle === "Referensi"));
  assert.equal(data.workspaces.some((item) => item.id === "document-center"), false);
});

test("all quick access IDs resolve", () => {
  const ids = new Set(data.resources.map((item) => item.id));
  assert.deepEqual(data.quickAccess.filter((id) => !ids.has(id)), []);
});

test("all resources have allowed URLs and valid references", () => {
  assert.deepEqual(validateData(data), []);
});

test("workspace root links are available", () => {
  assert.ok(data.workspaces.every((item) => item.rootUrl?.startsWith("https://")));
});

test("data contains documents and applications", () => {
  assert.equal(data.resources.filter((item) => item.type === "document").length, 140);
  assert.equal(data.resources.filter((item) => item.type === "application").length, 19);
});

test("multi-year periods are available", () => {
  const renstra = data.resources.find((item) => item.id === "perencanaan-renstra-2025-2029");
  assert.equal(renstra.period, "2025 - 2029");
  assert.equal(renstra.yearStart, 2025);
  assert.equal(renstra.yearEnd, 2029);
  assert.equal(renstra.year, null);
});

test("homepage quick access is four folders and four applications", () => {
  const map = new Map(data.resources.map((item) => [item.id, item]));
  const items = data.quickAccess.map((id) => map.get(id)).filter(Boolean);
  assert.equal(items.filter((item) => item.type !== "application").length, 4);
  assert.equal(items.filter((item) => item.type === "application").length, 4);
});

test("workflow settings and form URLs are available", () => {
  assert.equal(data.settings.workflowEnabled, true);
  assert.equal(data.settings.workflowVersion, "2.0.0");
  assert.equal(data.settings.documentUploadFormUrl, "");
  assert.equal(data.settings.agendaSubmitFormUrl, "");
  assert.equal(data.settings.monevMaterialFormUrl, "");
  assert.equal(data.settings.serviceLinksSource, "local-fallback");
});

test("application resources use optimized local logo files", () => {
  const applications = data.resources.filter((item) => item.type === "application");
  assert.ok(applications.every((item) => item.icon.endsWith(".webp")));
});

test("information collections remain available", () => {
  assert.ok(Array.isArray(data.agenda));
  assert.ok(Array.isArray(data.realization));
  assert.ok(Array.isArray(data.monevMaterials));
});


test("local deep-search fallback contains active leaf folders", () => {
  assert.ok(Array.isArray(data.searchIndex));
  assert.ok(data.searchIndex.length > 600);
  assert.ok(data.searchIndex.every((item) => item.kind === "deep-folder" && item.searchOnly === true));
});

test("BAHAN RAKOR is available as a direct folder in fallback index", () => {
  const items = data.searchIndex.filter((item) => item.leafName === "BAHAN RAKOR");
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((item) => item.period).sort(), ["2025", "2026", "2027"]);
});
