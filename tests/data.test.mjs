import test from "node:test";
import assert from "node:assert/strict";
import { getInitialData, validateData } from "../js/data/data-service.js";

const data = getInitialData();

test("local data has four workspaces", () => {
  assert.equal(data.workspaces.length, 4);
});

test("all quick access IDs resolve", () => {
  const ids = new Set(data.resources.map((item) => item.id));
  assert.deepEqual(data.quickAccess.filter((id) => !ids.has(id)), []);
});

test("all resources have allowed URLs and valid workspace references", () => {
  assert.deepEqual(validateData(data), []);
});

test("workspace root links are available", () => {
  assert.ok(data.workspaces.every((item) => item.rootUrl?.startsWith("https://")));
});

test("data contains documents and applications", () => {
  assert.ok(data.resources.some((item) => item.type === "document"));
  assert.ok(data.resources.some((item) => item.type === "application"));
});

test("homepage quick access is limited to four folders and four applications", () => {
  const map = new Map(data.resources.map((item) => [item.id, item]));
  const items = data.quickAccess.map((id) => map.get(id)).filter(Boolean);
  assert.equal(items.filter((item) => item.type !== "application").length, 4);
  assert.equal(items.filter((item) => item.type === "application").length, 4);
});

test("information hub data collections are available", () => {
  assert.ok(Array.isArray(data.agenda));
  assert.ok(Array.isArray(data.realization));
  assert.equal(data.settings.agendaHomeLimit, 3);
  assert.equal(data.settings.realizationHomeLimit, 1);
  assert.ok(data.realization.every((item) => Number.isFinite(item.financialValue) && Number.isFinite(item.physicalValue)));
});
