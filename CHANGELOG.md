# Changelog

## [0.3.0] - 2026-07-19

### Added
- Mode tampilan ringkas untuk penyematan Google Sites melalui `?embed=1`.
- Tombol folder utama dan ringkasan resource pada setiap Ruang Kerja.
- Pengurutan Pustaka berdasarkan relevansi, tahun, judul, atau ruang kerja.
- Manifest aplikasi serta ikon 192 px, 512 px, dan Apple Touch Icon.
- Unit test pencarian, validasi data, dan parser CSV.
- Panduan Google Sites dan checklist release.

### Changed
- Pencarian memberi bobot lebih tinggi pada judul, alias, kategori, kata kunci, subfolder, dan tahun.
- Pencarian mendukung kecocokan awal kata untuk istilah minimal empat karakter.
- Google Sheets disinkronkan setelah halaman lokal selesai tampil.
- Status data dan pesan kosong dibuat lebih informatif.
- Informasi versi dan jumlah resource pada halaman Tentang dibuat dinamis.

### Fixed
- Urutan hasil pencarian di Pustaka tidak lagi tertimpa oleh urutan tahun saat mode relevansi digunakan.
- Sinkronisasi Workspaces tetap mempertahankan tautan folder utama.
- Form filter Pustaka tidak melakukan reload tidak sengaja ketika tombol Enter ditekan.
- Menu seluler dapat ditutup menggunakan tombol Escape atau klik di luar menu.

## [0.2.1] - 2026-07-19

### Added
- Launchpad untuk 19 aplikasi penunjang PEPK.
- Ikon aplikasi internal yang konsisten dan ringan.
- Aplikasi dapat ditemukan melalui pencarian dan ditampilkan pada ruang kerja terkait.
- Filter jenis resource pada halaman Pustaka.

### Changed
- Akses Cepat homepage dibagi menjadi folder kerja dan aplikasi yang sering digunakan.
- Ringkasan Ruang Kerja menampilkan jumlah folder dan aplikasi.

## [0.2.0] - 2026-07-18

### Added
- Identitas visual dominan biru berdasarkan logo PEPK.
- Struktur empat Ruang Kerja dan folder dokumen berdasarkan tahun.
- Integrasi Google Sheets dan data lokal.
