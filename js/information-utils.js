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

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function monthName(month, short = false) {
  const name = MONTH_NAMES[Number(month) - 1] || "Bulan";
  return short ? name.slice(0, 3) : name;
}

export function formatPercentage(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(number)}%`;
}

export function realizationForYear(items = [], year) {
  return items
    .filter((item) => item?.isActive !== false && Number(item.year) === Number(year))
    .slice()
    .sort((a, b) => Number(a.month) - Number(b.month));
}

export function realizationYears(items = []) {
  return [...new Set(items.filter((item) => item?.isActive !== false).map((item) => Number(item.year)).filter(Number.isFinite))]
    .sort((a, b) => b - a);
}

export function latestRealization(items = [], year = null) {
  const candidates = items.filter((item) => item?.isActive !== false && (year === null || Number(item.year) === Number(year)));
  return candidates.slice().sort((a, b) => Number(b.year) - Number(a.year) || Number(b.month) - Number(a.month))[0] || null;
}

export function realizationDeviation(item, balancedThreshold = 2, attentionThreshold = 5) {
  const financial = Number(item?.financialValue);
  const physical = Number(item?.physicalValue);
  if (item?.financialValue === null || item?.physicalValue === null || !Number.isFinite(financial) || !Number.isFinite(physical)) {
    return { value: null, absolute: null, severity: "unknown", direction: "unknown", label: "Deviasi belum tersedia" };
  }

  const value = physical - financial;
  const absolute = Math.abs(value);
  const severity = absolute <= balancedThreshold ? "balanced" : absolute <= attentionThreshold ? "attention" : "large";
  const direction = value > 0 ? "physical" : value < 0 ? "financial" : "balanced";
  const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(absolute);
  let label = "Capaian fisik dan keuangan seimbang";
  if (direction === "physical") label = `Fisik lebih tinggi ${number} poin`;
  if (direction === "financial") label = `Keuangan lebih tinggi ${number} poin`;
  return { value, absolute, severity, direction, label };
}

export function realizationEvaluation(item, balancedThreshold = 2) {
  const deviation = realizationDeviation(item, balancedThreshold);
  if (deviation.value === null) {
    return {
      state: "unknown",
      status: "Belum tersedia",
      description: "Realisasi keuangan dan fisik belum dapat dibandingkan."
    };
  }
  const financialTarget = item?.financialTarget;
  const physicalTarget = item?.physicalTarget;
  const hasTargets = Number.isFinite(financialTarget) && Number.isFinite(physicalTarget);
  if (hasTargets) {
    const financialGap = Number(item.financialValue) - financialTarget;
    const physicalGap = Number(item.physicalValue) - physicalTarget;
    const reached = financialGap >= 0 && physicalGap >= 0;
    return {
      state: reached ? "good" : "attention",
      status: reached ? "Target tercapai" : "Di bawah target",
      description: `Target keuangan ${formatPercentage(financialTarget)}, fisik ${formatPercentage(physicalTarget)}. ${deviation.label}.`
    };
  }
  if (deviation.absolute > balancedThreshold) {
    return {
      state: "attention",
      status: "Selisih perlu ditinjau",
      description: `${deviation.label}. Target periode belum tersedia; capaian belum dapat dinilai.`
    };
  }
  return {
    state: "balanced",
    status: "Selisih dalam toleransi",
    description: `${deviation.label}. Target periode belum tersedia; ini bukan penilaian ketercapaian.`
  };
}

export function realizationPeriod(item) {
  if (!item) return "Periode belum tersedia";
  return `${monthName(item.month)} ${item.year}`;
}
