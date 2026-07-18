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
