# PEPK Workspace v0.3.0

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan, Dinas Kesehatan Kabupaten Kudus.

## Peningkatan versi 0.3.0

- Pencarian lebih akurat untuk judul, singkatan, sinonim, subfolder, dan tahun.
- Halaman Pustaka memiliki pengurutan berdasarkan relevansi, tahun, judul, atau ruang kerja.
- Setiap Ruang Kerja memiliki ringkasan resource, tombol folder utama, dan tautan Pustaka terfilter.
- Loading memakai pola local-first sehingga tampilan tidak menunggu Google Sheets.
- Sinkronisasi Google Sheets berjalan di latar belakang dengan satu kali percobaan ulang.
- Empty state, error state, dan status data dibuat lebih jelas.
- Mode khusus Google Sites tersedia melalui parameter `?embed=1`.
- Manifest dan ikon perangkat ditambahkan.
- Unit test untuk pencarian, data, dan CSV tersedia tanpa dependency tambahan.

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

Import file `docs/PEPK_Workspace_Data_v0.3.0.xlsx` menggunakan opsi **Replace spreadsheet**. Kolom `root_url` pada sheet Workspaces digunakan untuk tombol **Buka folder utama**.

## Google Sites

Gunakan URL berikut untuk penyematan:

```text
https://pepkdinkeskds-cmd.github.io/pepk-workspace/?embed=1
```

Panduan lengkap tersedia di `docs/GOOGLE-SITES.md`.
