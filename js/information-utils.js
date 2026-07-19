function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function agendaDateTime(item, useEnd = false) {
  if (!item?.date) return null;
  const time = useEnd ? (item.endTime || item.startTime || "23:59") : (item.startTime || "00:00");
  const value = new Date(`${item.date}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function agendaStatus(item, now = new Date()) {
  const end = agendaDateTime(item, true);
  if (end && end < now) return { key: "done", label: "Selesai" };
  const today = localDateKey(now);
  if (item.date === today) return { key: "today", label: "Hari ini" };
  return { key: "upcoming", label: "Akan datang" };
}

export function upcomingAgenda(items = [], now = new Date()) {
  return items
    .filter((item) => item?.isActive !== false && agendaStatus(item, now).key !== "done")
    .slice()
    .sort((a, b) => (agendaDateTime(a)?.getTime() || 0) - (agendaDateTime(b)?.getTime() || 0) || (a.sortOrder || 999) - (b.sortOrder || 999));
}

export function formatAgendaDate(value) {
  if (!value) return "Tanggal belum ditentukan";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatShortAgendaDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return "Waktu menyusul";
  if (startTime && endTime) return `${startTime}–${endTime}`;
  return startTime || endTime;
}

export function realizationProgress(item) {
  const value = Number(item?.value || 0);
  const target = Number(item?.target || 0);
  const maximum = item?.unit === "%" ? 100 : (target > 0 ? target : 100);
  const percent = maximum > 0 ? Math.max(0, Math.min(100, (value / maximum) * 100)) : 0;
  const attainment = target > 0 ? (value / target) * 100 : 0;
  return { percent, attainment };
}

export function formatMetricValue(value, unit = "") {
  const number = Number(value || 0);
  const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(number);
  return unit === "%" ? `${formatted}%` : `${formatted}${unit ? ` ${unit}` : ""}`;
}
