# Sumber data dan operasi

## Kontrak pembacaan

Sumber tetap spreadsheet publik yang sudah dipakai PEPK; identitasnya terdapat di `website/js/config.js`. Nama tab dan kolom dasar tidak diubah. Tidak diperlukan pembuatan tab baru untuk memasang website.

- CSV berheader benar dan tanpa baris data adalah sumber kosong yang sah.
- Item `is_active=FALSE` tidak dihidupkan kembali dari katalog bawaan.
- Sumber gagal atau tidak sesuai schema mempertahankan salinan sebelumnya untuk komponen tersebut, dengan label keterbatasan. Agenda/realisasi/materi yang belum mempunyai salinan tidak diganti contoh.
- Persentase harus numerik, 0–100, periode bulan/tahun sah, dan tidak duplikat. Tanggal harus kalender ISO `YYYY-MM-DD` yang benar.
- Cache schema 3 tidak membaca cache versi lama. Cache berumur lebih dari lima menit perlu diperbarui pada pembukaan halaman berikutnya. Ini bukan polling realtime.
- Katalog bawaan berasal dari metadata publik rilis sebelumnya, **bukan snapshot resmi yang sudah disahkan**. Manifest `catalog-version.json` menyatakan hal tersebut. Pembacaan daring juga tidak membuktikan pengesahan substantif oleh pemilik data.

## Realisasi

Baris bertanda contoh/dummy/demo/sample pada judul/keterangan dikecualikan. Penanda ini adalah pengaman terhadap contoh yang diketahui, bukan sistem klasifikasi yang menggantikan verifikasi operator. Jangan menggunakan penanda tersebut untuk data produksi yang memang telah diperiksa.

Kolom opsional untuk target: `financial_target` dan `physical_target` (alternatif terbaca: `target_financial`, `target_physical`). Keduanya harus berupa persentase 0–100. Tanpa kedua target, label hanya membaca selisih fisik–keuangan. Rilis ini tidak menambahkan atau mengisi kolom target di spreadsheet.

Selisih ditampilkan dalam **poin persentase**: fisik dikurangi keuangan. Ambang bawaan dua poin dan lima poin berasal dari Settings. Ambang membantu peninjauan; tidak membuktikan bahwa angka salah atau bahwa kinerja baik.

Sebelum menerbitkan angka resmi, pemilik data memeriksa periode, definisi persentase bulanan/kumulatif, pagu yang digunakan, target bila tersedia, tanggal sumber, dan keterangan. Website tidak mengasumsikan bahwa bulan yang lebih lama otomatis terlambat karena jadwal pelaporan belum ditetapkan dalam kebutuhan ini.

## Metadata, akses, dan pembaruan

Katalog, judul, jalur folder, dan data yang dikirim ke halaman statis dapat dibaca publik. `noindex` tidak menyediakan autentikasi. Izin isi file tetap dikelola pada Google Drive. Jika metadata juga harus privat, diperlukan lapisan akses dan endpoint privat; paket ini tidak menampilkan tombol login yang memberi rasa aman palsu.

Tetapkan penanggung jawab sumber dan jadwal verifikasi melalui proses internal instansi. Pencarian tautan rusak dapat dilaporkan lewat Feedback. Jangan memasukkan data kesehatan pribadi atau kata sandi ke katalog/Feedback.

## Pengelolaan rilis

Perubahan desain/kode menggunakan satu identifier release pada entry HTML dan seluruh import modul. Saat merilis ulang, jalankan pengujian serta pemeriksaan referensi. Jangan menggabungkan file JavaScript dari dua rilis.

`tools/normalize-release.mjs` menyamakan identifier RC2 dan dapat dijalankan ulang. `tools/prepare-catalog.mjs` dan `tools/capture-baseline.mjs` adalah alat pembuatan baseline, bukan pekerjaan harian operator. Jangan menjalankannya untuk mengganti data resmi tanpa pemeriksaan sumber. Website yang dikirim sudah siap dipakai tanpa menjalankan alat tersebut.

Backup versi website dan versi deployment sebelum memasang. Uji pemulihan file/data sesuai prosedur instansi; paket ini tidak mengakses atau menguji backup server produksi.
