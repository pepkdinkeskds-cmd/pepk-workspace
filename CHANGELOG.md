# Changelog

## 0.9.0 RC — Struktur Google Drive V2

- Mengalihkan sumber data ke Spreadsheet V2.
- Menambahkan dukungan periode multi-tahun.
- Menampilkan Document Center sebagai Referensi di Pustaka.
- Menyesuaikan pencarian, filter tahun, kartu resource, dan kelompok dokumen.
- Memperbarui fallback lokal dengan 140 folder dan 19 aplikasi.
- Menyertakan PEPK Workflow V2 dengan 656 rute tujuan aktif.
- Mempertahankan desain dan struktur navigasi v0.7.5.


## 0.7.5 — Refined Homepage Spacing

- Memadatkan jarak Beranda sedikit lagi setelah evaluasi v0.7.4.
- Akses Cepat dibuat lebih dekat dengan bagian berikutnya.
- Ruang Kerja, Agenda Terdekat, dan Capaian Realisasi dikurangi secara ringan.
- Ukuran kartu, tipografi, serta jarak internal komponen tetap dipertahankan.


## 0.7.4 — Homepage Spacing

- Mengurangi jarak vertikal antara Akses Cepat, Ruang Kerja, Agenda Terdekat, dan Capaian Realisasi.
- Pemadatan dilakukan khusus pada Beranda dengan intensitas sedang.
- Ukuran kartu, isi, tipografi, dan halaman lain tidak berubah.
- Jarak pada perangkat seluler tetap cukup lega untuk menjaga keterbacaan.


## 0.7.3 — UI Consistency

- Menyamakan pola Launchpad aplikasi pada Beranda dan seluruh Ruang Kerja.
- Mengubah kartu aplikasi Ruang Kerja menjadi baris horizontal yang rapi dan responsif.
- Mencegah nama aplikasi terpecah per huruf atau suku kata pada layar seluler.
- Menyamakan panel pencarian dan filter Materi Monev dengan Pustaka utama.
- Menambahkan perilaku responsif konsisten untuk desktop, tablet, dan ponsel.


## 0.7.2 — Google Sheets Header Fix

- Menetapkan `headers=1` pada seluruh permintaan Google Visualization CSV.
- Mencegah Google Sheets menebak banyak baris Settings sebagai header.
- Memulihkan pembacaan URL Form Unggah Dokumen, Agenda, dan Materi Monev.
- Memperbarui cache key modul frontend.

## 0.7.1

- Memperbaiki pembacaan URL formulir dari sheet Settings pada halaman Layanan, Beranda, dan Informasi.
- Menambahkan cache busting untuk modul data-service agar browser tidak memakai normalizer versi lama.
- Membersihkan spasi tersembunyi dan pemisah baris pada nilai URL Settings.

## 0.7.0 — Materi Monev

- Menambahkan Form dan workflow Materi Monev.
- Menambahkan sheet Monev_Inbox dan Monev_Materials.
- Menambahkan halaman Materi Monev dengan filter dan urutan presentasi.
- Menambahkan layanan ketiga pada Pusat Layanan.
- Menambahkan akses Materi Monev pada Ruang Kerja Evaluasi.

## [Unreleased]

### Changed
- Mengubah label antarmuka `Kontribusi` menjadi `Layanan`.
- Mengubah judul halaman menjadi `Pusat Layanan PEPK` tanpa mengubah rute internal.

# Changelog

## [Unreleased] — Review Beranda 01

### Changed
- Menggabungkan Akses Cepat dan Kontribusi Cepat dalam satu komposisi homepage.
- Memadatkan panel folder, aplikasi, unggah dokumen, dan tambah agenda.
- Menghapus Panduan dan Pengumuman dari Beranda; konten tetap tersedia di halaman Informasi.

## [0.7.0] - 2026-07-19

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

## [0.7.0] - 2026-07-19

### Added
- Pusat Kontribusi untuk unggah dokumen dan tambah agenda.
- `Upload_Inbox`, `Agenda_Inbox`, dan `Workflow_Config`.
- Google Apps Script untuk routing file, persetujuan, dan publikasi agenda.
- Form URL dinamis dari sheet Settings.
- Aset logo aplikasi WebP berdasarkan file yang diberikan Product Owner.

### Changed
- Layout capaian realisasi tahunan dibuat lebih compact dan seimbang.
- Navigasi ditambah menu Kontribusi.
- Versi aplikasi diperbarui menjadi 0.7.0.

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
