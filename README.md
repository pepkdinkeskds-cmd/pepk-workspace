# PEPK Workspace v0.2.1

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan, Dinas Kesehatan Kabupaten Kudus.

## Isi versi 0.2.1

- Akses Cepat dibagi menjadi folder kerja dan launchpad aplikasi.
- 19 aplikasi penunjang tersedia pada pencarian dan ruang kerja terkait.
- 8 aplikasi utama tampil di homepage.
- 28 kelompok dokumen dan 84 tautan folder tahun tetap tersedia.
- Pustaka memiliki filter jenis resource: folder atau aplikasi.
- Identitas visual tetap dominan biru sesuai logo PEPK.
- Tampilan responsif untuk desktop dan perangkat seluler.
- Data lokal tampil seketika dan Google Sheets disinkronkan di belakang layar.

## Menjalankan secara lokal

Karena menggunakan ES Modules, jalankan melalui local server:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`.

## Upload ke GitHub

1. Ekstrak ZIP.
2. Upload seluruh isi folder ke root repository `pepk-workspace`.
3. Pastikan `index.html`, folder `css`, `js`, dan `assets` berada langsung di root repository.
4. Commit perubahan dan tunggu GitHub Pages melakukan deployment.

## Google Sheets

Spreadsheet ID sudah diatur pada `js/config.js`. Gunakan file `PEPK_Workspace_Data_v0.2.1.xlsx` sebagai bahan import agar data folder dan aplikasi sama dengan data lokal.

## Struktur tautan folder

Tautan dokumen tetap berhenti pada tingkat **tahun**. Subfolder seperti Awal, Akhir, Perubahan, Triwulan, dan Data Pendukung dipilih di Google Drive.

## Versi

- Application Version: 0.2.1
- Content Updated: 19 Juli 2026
