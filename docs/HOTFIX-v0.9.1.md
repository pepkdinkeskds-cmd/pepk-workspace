# PEPK Workspace v0.9.1 — Runtime Hotfix

## Penyebab

`js/ui.js` pada paket v0.9.0 memiliki token `export export` sehingga browser gagal memuat modul UI.
Akibatnya kartu Akses Cepat, Ruang Kerja, kelompok dokumen, dan Pustaka tidak dirender.

## Perbaikan

- Sintaks UI diperbaiki.
- Seluruh file JavaScript diperiksa menggunakan `node --check`.
- URL layanan tidak lagi disalin secara statis.
- URL unggah dokumen, agenda, dan Materi Monev dibaca langsung dari sheet `Settings` V2.

## Persyaratan akses

Spreadsheet V2 harus dibagikan sebagai Viewer kepada siapa saja yang memiliki link agar GitHub Pages dapat membaca CSV Settings.
Folder Drive dan Google Form tetap dapat memiliki kebijakan akses masing-masing.
