const labels = {
  resources: "Katalog folder dan aplikasi", workspaces: "Ruang kerja", quickAccess: "Akses utama",
  agenda: "Agenda", realization: "Realisasi", settings: "Pengaturan", synonyms: "Istilah pencarian"
};
function timestamp(value) {
  return value ? new Intl.DateTimeFormat("id-ID", {dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta"}).format(new Date(value)) + " WIB" : "Belum dikonfirmasi";
}
export function sourceHealthRows(data = {}) {
  return Object.entries(labels).map(([key, label]) => {
    const meta = data._meta?.[key] || {source: "bundled"};
    const records = data[key];
    const count = Array.isArray(records) ? records.length : null;
    let status = "Katalog bawaan", tone = "warning";
    let description = "Pembaruan daring belum dikonfirmasi. Katalog dari paket website digunakan.";
    if (["agenda", "realization"].includes(key) && meta.source === "bundled") description = "Sumber daring belum dikonfirmasi. Paket tidak menggunakan angka atau agenda contoh.";
    if (meta.failed) {
      status = "Pembacaan gagal";
      description = meta.source === "cache" ? "Salinan terakhir digunakan. Pembaruan sumber belum berhasil." : "Sumber daring belum dapat digunakan. Periksa koneksi atau hubungi pengelola.";
      if (meta.error && !/abort|fetch|network|offline/i.test(meta.error)) description += ` ${meta.error}`;
    } else if (meta.source === "live" || meta.source === "cache") {
      status = meta.source === "live" ? "Sumber terbaca" : "Salinan tersimpan";
      tone = meta.fresh ? "ready" : "warning";
      description = meta.source === "live" ? "Respons sumber berhasil dibaca." : "Menggunakan hasil pembacaan sebelumnya.";
      if (count === 0) {status = "Belum ada data aktif"; description += " Sumber tidak berisi catatan aktif yang dapat ditampilkan.";}
      if (!meta.fresh) description += " Salinan perlu diperbarui.";
    }
    if (meta.warnings?.length) {
      tone = "warning";
      if (key === "realization" && count === 0) status = "Belum ditampilkan";
      else status = "Perlu diperiksa";
      description += ` ${meta.warnings.join(" ")}`;
      if (key === "realization") description += " Pengelola perlu memeriksa dan menerbitkan data resmi.";
    }
    let period = "";
    if (key === "realization" && count) {
      const latest = [...records].sort((a,b) => b.year-a.year || b.month-a.month)[0];
      if (latest) period = new Intl.DateTimeFormat("id-ID", {month: "long", year: "numeric", timeZone: "UTC"}).format(new Date(Date.UTC(latest.year, latest.month-1, 1)));
    }
    return {key, label, status, tone, description, count, period, checked: timestamp(meta.checkedAt)};
  });
}

export function emptySourceMessage(data, key) {
  const meta = data._meta?.[key];
  if (meta?.failed) return "Sumber belum dapat dibaca. Buka status data pada footer untuk melihat keterangannya.";
  if (meta?.warnings?.some((text) => /contoh/i.test(text))) return "Data contoh dikecualikan. Data yang layak dipublikasikan belum tersedia dari sumber; pengelola perlu memeriksanya.";
  if (!meta || meta.source === "bundled") return "Menunggu pembacaan sumber daring. Data contoh tidak digunakan sebagai pengganti.";
  return "Sumber belum memuat catatan aktif yang dapat ditampilkan. Periksa status data untuk waktu pembacaan terakhir.";
}
