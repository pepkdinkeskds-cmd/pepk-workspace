# Changelog

## 0.9.5 — Mobile Access Hotfix 01

- Membuka Submission Portal pada tab yang sama agar mengikuti jalur tautan langsung yang stabil di Chrome Android.
- Mempertahankan satu URL deployment `/exec`; tidak mengubah Apps Script atau izin akses.
- Memisahkan kontrol hamburger ke bootstrap mandiri tanpa import agar aktif sebelum modul data halaman selesai dimuat.
- Memperbesar target sentuh hamburger menjadi 52 × 52 piksel dan menambahkan optimasi interaksi sentuh.
- Mencegah pemasangan event handler menu ganda.
- Menaikkan cache key CSS, modul halaman, Feedback, dan Submission bridge ke `mobile-access-01`.
- Mempertahankan Feedback Pilot 01, data, Referensi, Pustaka, grafik, dan backend.

## 0.9.5 — Feedback Pilot 01

- Menambahkan tombol mengambang **Kirim Masukan** pada delapan halaman PEPK Workspace.
- Menyediakan formulir ringkas berisi Nama, Email, dan Masukan.
- Mengirim data melalui deployment Submission Portal yang sama tanpa menambahkan URL layanan baru.
- Menampilkan ID tanda terima `FB-...` setelah pengiriman berhasil.
- Mencatat halaman asal dan versi aplikasi tanpa menyimpan nama atau email di peramban.
- Menambahkan batas 1.500 karakter, honeypot, timeout, idempotensi, channel nonce, dan pemeriksaan origin respons.
- Menampilkan panel desktop dan bottom sheet ringkas pada ponsel.
- Mempertahankan seluruh fungsi dan pengujian baseline Quality 07.

## 0.9.5 — Quality 07

- Menutup temuan validasi semantik HTML dan aksesibilitas pada delapan halaman publik.
- Menambahkan peran grup pada ringkasan dan kumpulan kontrol yang memiliki nama aksesibel.
- Menambahkan tombol **Terapkan** pada filter Pustaka dan Materi Monev.
- Menghubungkan pencarian Materi Monev dengan ringkasan hasil yang diperbarui.
- Membuat urutan presentasi Materi Monev terbaca jelas tanpa atribut ARIA pada elemen generik.
- Menormalkan doctype HTML dan menaikkan cache key aset ke `quality-07`.
- Tidak mengubah sumber data, URL Submission Portal, rute Referensi, Pustaka, grafik, ataupun backend.

## 0.9.5 — Quality 06

- Menstabilkan menu seluler ketika breakpoint berubah serta mempertahankan penutupan melalui `Escape`.
- Membuat target **Lewati ke konten utama** dapat menerima fokus pada seluruh halaman.
- Menghubungkan kolom pencarian dengan wilayah hasil yang diperbarui.
- Menyediakan detail status pembaruan sebagai nama aksesibel, bukan hanya tooltip.
- Menormalkan pengumuman tab baru pada pintu masuk Submission Portal.
- Menghormati preferensi gerak minimum pengguna.
- Memperkuat kontras teks metadata pada permukaan terang.
- Tidak mengubah sumber data, rute Referensi, Pustaka, grafik, ataupun backend.

## 0.9.5 — Quality 05

- Menyelaraskan Beranda dan halaman Layanan dengan rute Referensi yang sudah lulus uji produksi.
- Menjelaskan empat jenis pengajuan: Dokumen, Agenda, Materi Monev, dan Referensi.
- Memperbarui alur layanan agar penempatan Referensi ke folder tujuan terbaca jelas.
- Menambahkan deteksi konteks Referensi pada pengaman Submission Portal.
- Menyatukan seluruh pintu masuk portal pada satu sumber URL berversi.
- Tidak mengubah URL portal, sumber data, Pustaka, ataupun backend.

## 0.9.5 — Quality 04

- Menyatukan status pembaruan konten pada seluruh menu dengan bahasa yang lebih mudah dipahami staf.
- Menghapus istilah teknis Google Sheets, sheet internal, data lokal, dan source code dari antarmuka pengguna.
- Mengganti istilah `administrator` menjadi `operator` serta menormalkan istilah dokumen, aplikasi, dan konten.
- Memperjelas keadaan kosong Agenda, Realisasi, Pustaka, Ruang Kerja, dan Materi Monev.
- Menambahkan semantik status aksesibel melalui `role="status"` dan live region yang sopan.
- Menaikkan cache key seluruh modul halaman yang berubah ke `quality-04`.

## 0.9.5 — Quality 03C

- Memperbesar kartu **Pengajuan PEPK** secara terukur agar deskripsi lengkap, termasuk Materi Monev, tidak terpotong.
- Menghapus pembatas dua baris pada deskripsi kartu pengajuan.
- Menambah jarak antara judul **Satu pintu pengajuan PEPK** dan deskripsi untuk memanfaatkan ruang panel secara lebih seimbang.
- Menyesuaikan kembali jarak serta tinggi kartu pada tablet dan ponsel agar tetap proporsional.
- Menaikkan versi cache CSS ke `quality-03c` dan menambahkan pengujian regresi kartu pengajuan.

## 0.9.5 — Quality 03B

- Menyamakan batas atas dan bawah kartu **Layanan Cepat** dengan kartu **Akses Cepat** pada desktop.
- Mendistribusikan isi Layanan Cepat secara vertikal agar kartu tetap proporsional setelah tingginya disamakan.
- Mempertahankan tinggi alami ketika kedua kartu ditumpuk pada tablet dan ponsel.
- Menjadikan satu kartu Pengajuan PEPK memenuhi area layanan pada susunan responsif.
- Menaikkan versi cache CSS ke `quality-03b` dan menambahkan pengujian regresi tata letak.

## 0.9.5 — Quality 03A

- Menetapkan satu skala tipografi lintas halaman untuk judul, isi, kontrol, metadata, dan badge.
- Menormalkan judul kartu dengan fungsi setara pada Pustaka, Informasi, Layanan, dan Materi Monev.
- Menaikkan detail tahun, kategori aplikasi, status Agenda, label Realisasi, serta badge Materi Monev ke batas minimum yang nyaman dibaca.
- Mempertahankan hierarki khusus judul Beranda dan judul halaman internal pada desktop maupun ponsel.
- Menambahkan pengujian regresi tipografi dan menaikkan versi cache CSS ke `quality-03a`.

## 0.9.5 — Quality 01A

- Menetapkan URL Submission Portal secara langsung pada tombol **Ajukan Materi Monev**.
- Menghapus ketergantungan tombol tersebut pada pengalihan JavaScript dan fallback halaman Layanan.
- Menambahkan pengujian tujuan URL aktual untuk mencegah tombol kembali ke Google Form lama.
- Menaikkan versi aset halaman Materi Monev untuk memutus cache produksi.

## 0.9.5 — Service Hub 05

- Mengembalikan akses Materi Monev pada halaman Pustaka melalui `monev.html`.
- Mengubah teks dan ikon tombol Mulai Pengajuan di Beranda menjadi putih.

## 0.9.5 — Intent-Aware Search

- Membedakan pencarian folder spesifik, folder induk, jalur menengah, aplikasi,
  referensi, dan periode multi-tahun.
- Menyembunyikan kartu induk apabila folder langsung sudah menjawab query.
- Query induk dan tahun menampilkan folder induk diikuti folder terdalamnya.
- Query induk tanpa tahun tetap ringkas pada tingkat periode.
- Menambahkan penanda Folder Induk dan Folder Langsung.
- Mengabaikan kata umum dalam kalimat alami.
- Menambahkan koreksi salah ketik sederhana sebagai fallback.
- Menambahkan ringkasan alasan hasil pencarian pada halaman Pustaka.

## 0.9.4 — Pencarian Folder Mendalam

- Menambahkan indeks seluruh folder terdalam aktif.
- Hasil bertanda Folder langsung membuka folder leaf tanpa melewati folder induk.
- Memprioritaskan kecocokan nama folder terdalam dan jalur lengkap.
- Folder terdalam hanya muncul saat pencarian; navigasi Pustaka tetap ringkas.
- Document Center/Referensi ikut dapat dicari.
- Menambahkan PEPK Workflow V2.2.0 untuk membangun sheet Search_Index.

## 0.9.3 — Referensi Workspace

- Menambahkan Referensi sebagai tab kelima setelah Keuangan pada halaman Ruang Kerja.
- Menggunakan root folder Document Center untuk tombol Buka folder utama.
- Menampilkan kelompok dan folder referensi dengan pola yang sama seperti Ruang Kerja lainnya.
- Menambahkan pencarian khusus dalam Referensi.
- Referensi tetap bersifat baca saja dan tidak dimasukkan ke Form unggah atau Upload_Routes.
- Empat kartu Ruang Kerja di Beranda tetap tidak berubah.

## 0.9.2 — Homepage Folder List

- Mengubah Folder Kerja pada Akses Cepat menjadi daftar horizontal satu kolom.
- Menyamakan pola kartu Folder Kerja dengan Launchpad aplikasi.
- Ikon berada di kiri, nama folder di tengah, dan ikon buka di kanan.
- Nama folder panjang tidak lagi terpecah pada kartu sempit.
- Data, tautan, Spreadsheet, Google Form, dan Apps Script tidak berubah.

## 0.9.1 — Runtime Hotfix

- Memperbaiki kesalahan sintaks `export export` pada `js/ui.js` yang menghentikan rendering seluruh kartu folder, Ruang Kerja, Pustaka, dan Akses Cepat.
- Menambahkan pemeriksaan sintaks otomatis untuk seluruh file JavaScript browser.
- Menghapus URL formulir statis dari fallback lokal.
- Halaman Layanan sekarang membaca URL formulir secara langsung dari sheet `Settings` V2.
- Menambahkan cache key baru agar browser tidak memakai modul v0.9.0 yang rusak.

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
# PEPK Workspace v0.9.5 — Submission Home 01

- Menyatukan Layanan Cepat Beranda menjadi satu kartu **Pengajuan PEPK**.
- Mengarahkan tombol **Mulai Pengajuan** ke Submission Portal aktif.
- Menghapus pintu masuk Google Form Dokumen dan Agenda dari Beranda.
- Menjelaskan bahwa status dan revisi dibuka melalui tautan unik pada email pengirim.
- Tidak menyimpan token pengajuan dalam source publik.
# v0.9.5 — SERVICE_HUB_02

- Merampingkan panel Layanan Cepat di Beranda agar tidak menyisakan ruang kosong.
- Mengubah Pusat Layanan menjadi satu pintu Submission Portal.
- Menambahkan panel informasi status dan perbaikan melalui email.
- Menghapus ketergantungan tampilan Pusat Layanan pada tiga URL Google Form lama.
- Tidak menampilkan tautan Operator Console pada website publik.
## v0.9.5 — Service Hub 06

- Menghapus latar biru solid pada aksi `Mulai Pengajuan` di Pusat Layanan.
- Menghapus latar biru solid pada aksi `Buka Materi` di Pustaka.
- Mempertahankan seluruh kartu sebagai area klik dengan umpan balik hover dan focus.
- Menaikkan versi aset untuk memutus cache tampilan lama.
# PEPK Workspace v0.9.5 QUALITY 01

- Mengarahkan pengajuan Materi Monev dan Agenda ke satu Submission Portal.
- Menempatkan Materi Monev sebagai bagian dari navigasi Pustaka.
- Mengganti label tindakan menjadi “Ajukan Materi Monev” dan “Ajukan Agenda”.
- Menghapus teks empty state yang mengekspos istilah teknis spreadsheet.
- Menambahkan pemeriksaan regresi untuk Google Form lama, menu aktif, label tindakan, dan heading kosong.
# PEPK Workspace v0.9.5 QUALITY 02

## Optimasi Pustaka dan keterbacaan

- Pustaka menampilkan 24 hasil pertama dan menambahkan 24 hasil per klik melalui aksi **Muat lebih banyak**.
- Pencarian, filter, pengurutan, navigasi riwayat, dan pembaruan data otomatis mengatur ulang jumlah hasil yang tampil.
- Ringkasan membedakan total hasil dan jumlah item yang sedang ditampilkan.
- Ukuran teks deskripsi, metadata, label filter, status data, dan footer ditingkatkan agar lebih nyaman dibaca.
- Fokus keyboard dipindahkan ke hasil baru setelah pengguna memuat item tambahan.
- Versi aset diseragamkan ke `quality-02` untuk mencegah cache lama.

# PEPK Workspace v0.9.5 QUALITY 03

## Responsivitas dan kenyamanan antarmuka

- Memperbesar metadata penting dan teks pendukung yang masih terlalu kecil.
- Menetapkan target sentuh minimum untuk tautan, filter, navigasi, dan kontrol utama.
- Mengurangi tinggi hero agar konten utama lebih cepat terlihat tanpa menghilangkan identitas visual.
- Menstabilkan header, filter, tab Ruang Kerja, kartu, dan footer pada tablet serta ponsel.
- Membuat tab Ruang Kerja dapat digeser secara horizontal pada layar sempit tanpa merusak tata letak.
- Memperbaiki susunan kartu Materi Monev, panel layanan, dan tombol reset pada ponsel.
- Menambahkan perlindungan tata letak untuk layar sangat sempit hingga 320 px.
- Menyeragamkan versi aset ke `quality-03` untuk mencegah cache lama.

# PEPK Workspace v0.9.5 QUALITY 03D

## Tren realisasi dan evaluasi Beranda

- Mengubah ringkasan Realisasi menjadi satu kartu dengan komposisi desktop 62:38.
- Menampilkan grafik Keuangan dan Fisik dari Januari sampai bulan terbaru tanpa permintaan data tambahan.
- Menyusun ringkasan Keuangan, Fisik, dan Hasil Evaluasi secara vertikal.
- Menerapkan status Sesuai, Seimbang, dan Perlu perhatian sesuai hubungan capaian fisik terhadap keuangan.
- Menumpuk grafik dan ringkasan secara responsif pada tablet serta ponsel.
