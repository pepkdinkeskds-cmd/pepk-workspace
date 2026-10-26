# Pemeriksaan tampilan browser RC4

Tanggal: 26 Oktober 2026. Browser: Chrome melalui preview lokal yang disediakan lingkungan kerja.

## Hasil layout

| Ukuran CSS | Mode | Tinggi footer | Hasil |
|---|---|---:|---|
| 1366×768 | Lima layar | 57 px | Kelima panel masing-masing 622 px; tidak ada konten panel yang melampaui tinggi panel pada kasus yang diuji. |
| 1920×1080 | Lima layar | 57 px | Kelima panel masing-masing 934 px; tidak ada overflow panel atau horizontal. |
| 960×540 | Lima layar, pratinjau ringkas | 57 px | Kelima panel masing-masing 394 px; tetap muat, termasuk ringkasan realisasi dengan target. |
| 360×800 | Gulir alami | 57 px | Tidak ada overflow horizontal; footer tersedia; isi panjang tumbuh mengikuti konten. |
| 390×844 | Gulir alami | 57 px | Tidak ada overflow horizontal; dialog sumber muat pada lebar layar dan isinya dapat digulir. |

Viewport utama browser 1363×936 juga diperiksa tanpa frame: header 89 px, viewport konten 790 px, footer 57 px. Posisi footer sama setelah berpindah bagian. Panel Masukan berakhir 11 px di atas footer pada ukuran ini.

Pada uji awal, layout 960×540 melampaui tinggi panel di beberapa bagian, dan realisasi berisi data masih sedikit lebih tinggi pada laptop. Perbaikan akhir mengurangi pratinjau layar pendek, jarak kartu, serta catatan sumber berulang. Pengukuran akhir desktop dilakukan lagi dengan data realisasi sintetis; kelima panel muat. Data sintetis tidak ada pada halaman produksi.

## Interaksi yang diperiksa di browser

- Tombol berikutnya berpindah dari Mulai ke Akses utama `02/05` sementara footer tetap terlihat.
- `ArrowDown` pada konten Akses utama berpindah ke Ruang kerja `03/05`.
- Satu operasi scroll roda mouse pada Ruang kerja berpindah ke Agenda `04/05`.
- Pemilih bagian dapat menuju Realisasi `05/05`, dan tombol berikutnya nonaktif pada akhir.
- Dialog Status menampilkan tujuh sumber, termasuk penjelasan pengecualian data contoh pada Realisasi.
- Menutup Status dan membuka Masukan mempertahankan bagian aktif. Tidak ada formulir yang dikirim.
- Footer Masukan hanya memiliki satu launcher dan panelnya tidak menutupi bar bawah.

## Metode dan batas

Ukuran 1366/1920/360/390/960 diperiksa dengan iframe responsif pada browser yang sama. Harness lokal melewati deteksi embed pada dua salinan file QA agar mode lima layar dapat diuji di iframe. Isi dan CSS yang diuji mengikuti sumber rilis; salinan tersebut tidak disertakan dalam ZIP.

960×540 adalah simulasi ukuran CSS efektif pembesaran halaman 200% dari layar 1920×1080. Ini bukan pengujian zoom native atau pembesaran font sistem, dan bukan pengujian perangkat HP fisik. Pengujian ini tidak merupakan sertifikasi WCAG atau pengukuran Core Web Vitals.

Pemeriksaan source/status menggunakan pembacaan sumber publik dan salinan lokal yang tersedia. Tidak dilakukan upload, pengiriman Feedback/pengajuan, perubahan angka, email, atau operasi akun/izin produksi.
