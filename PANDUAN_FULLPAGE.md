# PEPK Workspace 0.9.7 RC3 — Fullpage Beranda

Paket ini khusus website GitHub Pages. Tidak memerlukan pemasangan atau pembaruan Submission Portal/Apps Script.

## Penyebab fitur sebelumnya tidak berjalan

ZIP GitHub yang diberikan memuat dua set sumber. `index.html` memanggil `js/pages/home.js` dan `css/main.css`, tetapi berkas RC2 baru berada di root sebagai `home.js`, `home-scenes.js`, dan `main.css`. Berkas yang dipanggil pada subfolder masih versi lama. `js/boot.js` yang dipanggil HTML juga belum berada di lokasi tersebut.

Di samping masalah letak file, controller RC2 masih mengizinkan gulir asli ketika bagian lebih panjang daripada layar atau pointer berada di atas tautan/tombol. Perilaku itu tidak memenuhi permintaan satu input untuk satu layar penuh.

Rilis ini mengembalikan sumber yang telah dilampirkan ke folder yang benar, menyeragamkan identifier cache RC3, dan mengganti controller beranda. Bridge Submission yang aktif pada ZIP sumber dipertahankan. Tidak ada sumber Apps Script pada paket ini.

## Perilaku yang dibuat

Pada desktop dengan lebar lebih dari 832 px, halaman menjadi enam layar:

1. Mulai / pencarian.
2. Folder dan aplikasi.
3. Ruang kerja.
4. Agenda.
5. Realisasi.
6. Informasi layanan / footer.

Satu `↓` atau `Page Down` berpindah satu layar penuh; `↑` atau `Page Up` kembali satu layar. `Home` menuju awal dan `End` menuju layar terakhir. Satu gerakan roda mouse/trackpad memindahkan satu bagian. Input selama animasi dan gerakan sisa trackpad ditahan agar tidak melompat beberapa layar atau kembali menjadi gulir kecil bawaan browser.

Controller memakai viewport tetap, tinggi panel satu layar, dan pemindahan posisi viewport ke panel tujuan. Tidak menunggu bagian mencapai batas scroll. Controller dimuat langsung oleh HTML dan tidak bergantung pada koneksi Google Sheets.

Input teks, textarea, pilihan form, dialog Feedback, zoom, dan gerakan horizontal mempertahankan perilaku aslinya. HP dan mode embed tetap memakai gulir biasa. Jika layar sangat pendek atau teks diperbesar hingga suatu panel lebih panjang, isinya tetap tersedia melalui bilah gulir panel/keyboard Tab; roda mouse pada konten umum tetap menuju panel berikutnya.

## Pemasangan GitHub

1. Simpan commit website yang sekarang sebagai titik pemulihan.
2. Ekstrak ZIP ini. **`index.html` sudah berada langsung pada root ZIP**, sejajar dengan folder **`js`**, **`css`**, dan **`assets`**.
3. Unggah isi hasil ekstraksi ke lokasi website yang sekarang. **Pertahankan foldernya. Jangan meletakkan `home.js`, `home-fullpage.js`, atau `main.css` di root secara terpisah.**
4. Pastikan pada repository terdapat `js/home-fullpage.js`, `js/pages/home.js`, `css/home-fullpage.css`, dan `css/main.css`.
5. Tunggu deployment GitHub Pages selesai. Buka `index.html`, lalu lakukan `Ctrl+F5`.
6. Di desktop, indikator awal harus **01 / 06**. Klik area kosong pada beranda, tekan `↓` satu kali: tampilan harus sampai layar **Folder kerja dan aplikasi**, indikator **02 / 06**.

Berkas lama yang tidak dirujuk oleh HTML tidak menentukan fitur ini. Yang menentukan adalah isi berkas pada jalur di atas. Jangan mengunggah ZIP sebagai satu berkas unduhan saja; GitHub Pages menjalankan berkas hasil ekstraksinya.

## Validasi

18 uji otomatis lulus: controller dari script yang benar-benar dirujuk `index.html`, posisi layar, panah/roda mouse, tautan/tombol, inertia, input/dialog, reduced motion, resize, hash, mobile/embed, dan pemuatan delapan halaman. Referensi semua aset/modul, sintaks 25 JavaScript, dan dua CSS lulus. ZIP juga diekstrak ulang dan diperiksa agar path deploy tidak kembali salah.

Uji posisi memakai JSDOM dengan ukuran viewport simulasi; ini bukan pengujian visual browser atau perangkat fisik. Browser QA tidak tersedia dalam lingkungan pengerjaan. Detail bukti ada di `verification/`.

Akses sumber SIPD saat pemeriksaan mengembalikan HTTP 403. Karena itu, tidak ada klaim bahwa rilis ini memakai library atau kode yang sama dengan SIPD. Perilaku dibuat berdasarkan contoh tampilan dan interaksi yang dijelaskan.

## Pemulihan dan pemeriksaan pengembang

Kembalikan commit website sebelumnya untuk memulihkan rilis. Rilis ini tidak mengubah isi sumber spreadsheet atau data Drive.

Untuk memeriksa paket menggunakan Node.js 22 atau lebih baru:

```bash
npm ci
npm test
npm run check
```

`verification/prepare-release.mjs` hanya menyamakan identifier RC3; tidak perlu dijalankan untuk memasang website.
