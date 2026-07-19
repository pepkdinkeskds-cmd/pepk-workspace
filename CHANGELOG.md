# Changelog

## [0.6.1] - 2026-07-19

### Added
- `Upload_Routes` untuk daftar tujuan folder yang disinkronkan dari Google Drive.
- Pilihan tujuan unggah berdasarkan ruang kerja dan `folder_id`.
- Sinkronisasi struktur folder manual dan harian.
- Fungsi pemeriksaan konfigurasi serta perbaikan ID agenda lama.

### Changed
- PIC tidak lagi mengetik nama subfolder secara bebas.
- Form unggah menampilkan tujuan folder yang valid sesuai Ruang Kerja.
- Salinan halaman Kontribusi disesuaikan dengan routing folder terkontrol.

### Fixed
- Format `published_id`, tanggal, dan waktu agenda dibuat konsisten.
- Pembangunan ulang Google Form aman terhadap navigasi antarbagian.
- File disetujui dipindahkan menggunakan ID folder, bukan pencocokan nama.

## [0.6.1] - 2026-07-19

### Added
- Pusat Kontribusi untuk unggah dokumen dan tambah agenda.
- `Upload_Inbox`, `Agenda_Inbox`, dan `Workflow_Config`.
- Google Apps Script untuk routing file, persetujuan, dan publikasi agenda.
- Form URL dinamis dari sheet Settings.
- Aset logo aplikasi WebP berdasarkan file yang diberikan Product Owner.

### Changed
- Layout capaian realisasi tahunan dibuat lebih compact dan seimbang.
- Navigasi ditambah menu Kontribusi.
- Versi aplikasi diperbarui menjadi 0.6.1.

### Security
- PIC dapat mengirim dokumen tanpa memperoleh akses Editor ke folder utama.
- Dokumen dan agenda harus melewati persetujuan administrator.

## [0.5.0] - 2026-07-19

### Added
- Kartu gabungan realisasi keuangan, capaian fisik, dan deviasi bulan terbaru.
- Grafik garis perkembangan Januari–Desember tanpa library eksternal.
- Tabel rincian bulanan dan pemilih tahun pada Pusat Informasi.
- Status deviasi relatif seimbang, perlu perhatian, dan deviasi besar.
- Identitas visual aplikasi yang lebih mudah dikenali dengan fallback otomatis.

### Changed
- Sheet `Realization` menggunakan satu baris per bulan dengan nilai keuangan dan fisik.
- Deviasi dihitung otomatis sebagai capaian fisik dikurangi realisasi keuangan.
- Homepage hanya menampilkan ringkasan bulan terbaru agar tetap ringkas.

## [0.4.1] - 2026-07-19

### Fixed
- Mengganti ID sumber Google Sheets setelah spreadsheet lama terhapus.
- Memperbarui versi aset untuk mencegah browser memakai cache v0.4.0.

## [0.4.0] - 2026-07-19

### Added
- Pusat Informasi yang terdiri dari Agenda, Capaian Realisasi, serta Panduan dan Pengumuman.
- Sheet `Agenda` untuk jadwal rapat internal, undangan eksternal, lokasi, PIC, dan tautan pendukung.
- Sheet `Realization` untuk indikator capaian, target, periode, dan tanggal pembaruan.
- Kartu agenda dengan status otomatis Hari ini, Akan datang, atau Selesai.
- Kartu realisasi dengan angka utama dan progress bar.

### Changed
- Akses Cepat dibatasi menjadi empat folder dan empat aplikasi.
- Halaman Informasi dikembangkan menjadi pusat informasi operasional.
- Bagian panduan dipindahkan setelah Agenda dan Capaian Realisasi.
- Struktur Google Sheets bertambah dari enam menjadi delapan sheet.

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
