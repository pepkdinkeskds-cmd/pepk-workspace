# PEPK Workspace v0.2.0

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan, Dinas Kesehatan Kabupaten Kudus.

## Isi versi 0.2.0

- Identitas visual dominan biru sesuai logo PEPK.
- Logo transparan untuk header, footer, favicon, dan Google Sites.
- Ikon SVG internal tanpa library eksternal.
- 4 ruang kerja: Perencanaan, Evaluasi, Pelaporan, dan Keuangan.
- 28 kelompok dokumen dan 84 tautan folder tahun.
- Pencarian berdasarkan dokumen, ruang kerja, tahun, dan istilah subfolder.
- Halaman Pustaka dengan filter ruang kerja dan tahun.
- Tampilan responsif untuk desktop dan perangkat seluler.
- Data lokal tampil seketika untuk mengurangi waktu tunggu.
- Sinkronisasi Google Sheets berjalan di belakang layar.

## Menjalankan secara lokal

Karena menggunakan ES Modules, jalankan melalui local server:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`.

## Upload ke GitHub

1. Ekstrak ZIP.
2. Upload seluruh isi folder ke root repository `pepk-workspace`.
3. Pilih **Add files → Upload files**.
4. Pastikan `index.html`, folder `css`, `js`, dan `assets` berada langsung di root repository.
5. Commit perubahan.
6. Tunggu GitHub Pages melakukan deployment.

## Google Sheets

Spreadsheet ID sudah diatur pada `js/config.js`.

Aplikasi selalu memuat data lokal lebih dahulu. Jika sheet `Resources`, `Workspaces`, `Quick_Access`, `Information`, `Synonyms`, dan `Settings` telah terisi dan dapat diakses publik, data Google Sheets akan menggantikan data lokal secara otomatis.

Gunakan file `PEPK_Workspace_Data_v0.2.0.xlsx` yang disertakan sebagai bahan import ke Google Sheets.

## Struktur tautan

PEPK Workspace membuka folder sampai tingkat **tahun**. Subfolder seperti Awal, Akhir, Perubahan, Triwulan, dan Data Pendukung tetap dipilih di Google Drive.

## Versi

- Application Version: 0.2.0
- Content Updated: 18 Juli 2026
