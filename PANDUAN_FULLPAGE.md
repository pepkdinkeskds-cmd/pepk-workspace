# PEPK Workspace 0.9.7 RC4 — Footer Ringkas

Rilis website GitHub Pages, 26 Oktober 2026. Tidak memerlukan pembaruan Submission Portal atau Apps Script.

## Perubahan utama

- Beranda memiliki **lima bagian**: Mulai, Akses utama, Ruang kerja, Agenda, dan Realisasi.
- Footer berada di luar viewport konten. Pada desktop tingginya sekitar **57 px**, terlihat pada semua bagian, dan tidak menjadi layar keenam.
- Footer memuat identitas ringkas, tombol atas/bawah, pemilih bagian, posisi `01/05–05/05`, versi, status data, dan Masukan.
- Nama bagian dapat dipilih untuk berpindah langsung. Satu tekan panah atau satu gerakan roda mouse tetap berpindah satu bagian penuh.
- Status data dapat diklik untuk melihat sumber yang berhasil dibaca, salinan yang digunakan, catatan kosong, dan penyebab peringatan. Menutup dialog mengembalikan fokus ke footer tanpa memindahkan bagian.
- Masukan menggunakan satu tombol footer. Formulir terbuka di atas footer; tombol mengambang besar pada beranda dihapus.
- Pratinjau diringkas pada layar pendek: akses utama menampilkan dua pilihan tiap kategori dan grafik realisasi diarahkan ke ringkasan angka. Tautan katalog/rincian tetap tersedia. Catatan sumber lengkap ada pada dialog status.
- HP memakai gulir alami dengan footer ringkas yang tetap tersedia. Navigasi layar desktop disembunyikan pada HP.

## Pemasangan

1. Simpan commit website aktif sebagai titik pemulihan.
2. Ekstrak ZIP. `index.html` sudah berada langsung pada root, sejajar dengan folder `js`, `css`, dan `assets`.
3. Unggah isinya ke lokasi website GitHub yang sekarang, **dengan struktur folder tetap utuh**. Jangan memindahkan file dari `js` atau `css` ke root.
4. Tunggu GitHub Pages selesai diterbitkan, kemudian lakukan `Ctrl+F5`.
5. Pastikan footer menunjukkan RC4 dan `01/05`. Uji panah, roda mouse, pemilih bagian, Status, serta Masukan. `End` berhenti di Realisasi `05/05`.

Rilis ini belum dipasang ke repository GitHub produksi oleh penyusun. Tidak ada pengubahan isi spreadsheet, angka realisasi, atau izin Drive.

## Arti status

“Sumber terbaca” berarti pembacaan berhasil, bukan pengesahan angka atau bukti bahwa periode sudah mutakhir. Peringatan yang sudah ada pada salinan sumber tetap terlihat saat pembaruan daring belum selesai.

Jika Realisasi bertanda data contoh, angka tetap dikecualikan. Dialog menjelaskan alasannya dan periode data ditampilkan apabila tersedia. Pemeriksaan serta publikasi angka resmi tetap mengikuti proses pengelola.

## Verifikasi

Hasil pengujian otomatis ada di `verification/test-results.txt`. Pemeriksaan jalur deploy, sintaks, dan CSS ada di `verification/release-check.json`.

Tampilan juga diperiksa langsung di Chrome melalui preview lokal, termasuk ukuran laptop 1366×768, desktop 1920×1080, HP 360×800/390×844, serta viewport efektif 960×540 untuk pembesaran halaman 200% dari 1920×1080. Lihat `verification/BROWSER_QA.md` untuk metode dan batas buktinya.

Tidak dilakukan pengiriman formulir, pengujian email, perubahan sumber daring, atau pengujian HP fisik. Submission bridge dan aset dipertahankan dari RC3.

## Pemeriksaan pengembang

Dengan Node.js 22 atau lebih baru:

```bash
npm ci
npm test
npm run check
```

`verification/sync-preview.mjs` dan `verification/prepare-browser-qa.mjs` adalah alat pemeriksaan lokal. File hasilnya pada `preview-dist/` tidak disertakan pada ZIP. Data sintetis hanya digunakan di harness QA untuk memeriksa grafik; tidak masuk ke beranda atau sumber data produksi.

Untuk pemulihan, kembalikan commit website sebelumnya. Penyimpanan/pemulihan data spreadsheet tidak dikendalikan oleh paket website.
