# PEPK Workspace v0.5.0

Versi penyempurnaan capaian realisasi dan identitas visual aplikasi.

## Perubahan utama

- Realisasi keuangan dan fisik digabung menjadi satu indikator bulanan.
- Deviasi dihitung otomatis dengan rumus `fisik - keuangan` dalam poin persentase.
- Homepage menampilkan bulan terbaru.
- Pusat Informasi menampilkan grafik Januari–Desember, pemilih tahun, dan tabel bulanan.
- Bulan tanpa data ditampilkan sebagai `Belum tersedia`, bukan nol.
- Ikon aplikasi diperbarui menjadi identitas visual yang lebih mudah dikenali dengan fallback monogram.

## Struktur sheet Realization

```text
id
year
month
financial_value
physical_value
updated_at
description
sort_order
is_active
```

Satu baris mewakili satu bulan. Nilai disarankan berupa capaian kumulatif 0–100.

## Upload ke GitHub

1. Unggah seluruh isi folder ke root repository.
2. Timpa file versi sebelumnya.
3. Commit: `feat(release): perbarui PEPK Workspace ke v0.5.0`.
4. Tunggu GitHub Pages lalu tekan `Ctrl + F5`.

## Google Sheets

Impor `PEPK_Workspace_Data_v0.5.0.xlsx` menggunakan **Ganti spreadsheet** agar ID spreadsheet tetap sama.
