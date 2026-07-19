import test from "node:test";
import assert from "node:assert/strict";
import {
  agendaStatus,
  upcomingAgenda,
  formatPercentage,
  latestRealization,
  realizationDeviation,
  realizationForYear,
  realizationYears
} from "../js/information-utils.js";

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

test("deviation is physical minus financial", () => {
  const result = realizationDeviation({ financialValue: 72.45, physicalValue: 68.20 });
  assert.equal(Number(result.value.toFixed(2)), -4.25);
  assert.equal(result.direction, "financial");
  assert.equal(result.severity, "attention");
  assert.equal(formatPercentage(72.45), "72,45%");
});

test("realization utilities select years, series, and latest month", () => {
  const items = [
    { id: "a", year: 2025, month: 12, isActive: true },
    { id: "b", year: 2026, month: 6, isActive: true },
    { id: "c", year: 2026, month: 7, isActive: true }
  ];
  assert.deepEqual(realizationYears(items), [2026, 2025]);
  assert.deepEqual(realizationForYear(items, 2026).map((item) => item.id), ["b", "c"]);
  assert.equal(latestRealization(items).id, "c");
});
