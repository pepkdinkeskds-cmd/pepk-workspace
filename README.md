# PEPK Workspace v0.4.0

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan, Dinas Kesehatan Kabupaten Kudus.

## Peningkatan versi 0.4.0

- Akses Cepat dipadatkan menjadi empat folder dan empat aplikasi.
- Pusat Informasi memiliki Agenda, Capaian Realisasi, serta Panduan dan Pengumuman.
- Agenda memuat tanggal, waktu, kategori, lokasi, PIC, dan tautan bahan rapat.
- Capaian Realisasi menampilkan angka, target, periode, progress bar, dan tanggal pembaruan.
- Dua sheet baru tersedia: `Agenda` dan `Realization`.
- Homepage tetap ringan dan menggunakan data lokal sebelum sinkronisasi Google Sheets.

## Menjalankan secara lokal

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`.

## Pemeriksaan opsional

```bash
npm test
npm run check
```

Perintah tersebut menggunakan Node.js bawaan dan tidak membutuhkan instalasi package.

## Upload ke GitHub

1. Ekstrak ZIP.
2. Upload seluruh isi folder ke root repository `pepk-workspace`.
3. Timpa file versi sebelumnya.
4. Commit dan tunggu GitHub Pages memperbarui website.
5. Buka halaman dengan `Ctrl + F5`.

## Google Sheets

Import file `docs/PEPK_Workspace_Data_v0.4.0.xlsx` menggunakan opsi **Replace spreadsheet**.

Baris contoh pada sheet `Agenda` dan `Realization` menggunakan `is_active = FALSE`, sehingga tidak tampil pada website. Ganti data contoh, lalu ubah menjadi `TRUE` ketika data sudah siap ditampilkan.

## Hosting

GitHub Pages tetap menjadi hosting utama. Mode `?embed=1` masih tersedia bila di kemudian hari diperlukan untuk penyematan pada portal lain.
