import test from "node:test";
import assert from "node:assert/strict";
import { agendaStatus, upcomingAgenda, realizationProgress, formatMetricValue } from "../js/information-utils.js";

const now = new Date("2026-07-19T10:00:00");

test("agenda status identifies today, upcoming, and completed items", () => {
  assert.equal(agendaStatus({ date: "2026-07-19", startTime: "09:00", endTime: "11:00" }, now).key, "today");
  assert.equal(agendaStatus({ date: "2026-07-20", startTime: "09:00" }, now).key, "upcoming");
  assert.equal(agendaStatus({ date: "2026-07-18", endTime: "11:00" }, now).key, "done");
});

test("upcoming agenda excludes completed items and sorts chronologically", () => {
  const result = upcomingAgenda([
    { id: "b", date: "2026-07-21", startTime: "09:00", isActive: true },
    { id: "a", date: "2026-07-20", startTime: "09:00", isActive: true },
    { id: "past", date: "2026-07-18", startTime: "09:00", isActive: true }
  ], now);
  assert.deepEqual(result.map((item) => item.id), ["a", "b"]);
});

test("realization progress uses a 100 point scale for percentages", () => {
  const result = realizationProgress({ value: 72.45, target: 75, unit: "%" });
  assert.equal(Number(result.percent.toFixed(2)), 72.45);
  assert.equal(Number(result.attainment.toFixed(1)), 96.6);
  assert.equal(formatMetricValue(72.45, "%"), "72,45%");
});
