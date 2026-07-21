# Pencarian Folder Mendalam — PEPK Workspace v0.9.4

## Tujuan

Staf dapat mencari folder terdalam tanpa memahami struktur Google Drive.

Contoh:

- `bahan rakor 2026`
- `dpa pergeseran 2026`
- `renstra rancangan akhir`
- `indikator kinerja 2027`

Hasil bertanda **Folder langsung** membuka folder leaf yang tepat.

## Arsitektur

- `Resources` tetap digunakan untuk kartu navigasi tahun/periode.
- `Search_Index` digunakan hanya ketika pengguna mengetik kata pencarian.
- Ruang Kerja dan Pustaka tidak dipenuhi ratusan kartu.

## Langkah 1 — Perbarui Apps Script

1. Buka `PEPK Workspace Data V2`.
2. Pilih **Ekstensi → Apps Script**.
3. Ganti isi `Code.gs` dengan `PEPK_Workflow_V2.2.0_DEEP_SEARCH.gs`.
4. Simpan dan muat ulang Google Sheets.
5. Pilih:

   `PEPK Workflow → Sinkronkan indeks pencarian mendalam`

6. Pastikan muncul notifikasi jumlah folder terdalam.
7. Pastikan sheet `Search_Index` terbentuk.

## Langkah 2 — Pasang patch website

Unggah isi `pepk-workspace-v0.9.4-deep-search-patch.zip` ke root repository GitHub.

Commit yang disarankan:

`feat(search): tambahkan pencarian folder mendalam v0.9.4`

## Pengujian

1. Cari `bahan rakor`.
2. Hasil pertama harus berupa tiga kartu bertanda `FOLDER LANGSUNG`.
3. Klik `BAHAN RAKOR — MONEV KINERJA DAN ANGGARAN 2026`.
4. Folder yang terbuka harus langsung `BAHAN RAKOR`.
5. Cari `dpa pergeseran 2026`.
6. Hasil folder langsung harus berada di atas kartu folder induk.

## Catatan

- Folder terdalam hanya muncul ketika ada pencarian.
- Document Center/Referensi ikut diindeks.
- Folder teknis seperti inbox dan folder ditolak tidak ikut.
- Setelah perubahan struktur Drive, jalankan kembali sinkronisasi indeks pencarian.
