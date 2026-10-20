# Hasil dan batas validasi

Tanggal: 20 Oktober 2026.

## Hasil pemeriksaan

| Pemeriksaan | Hasil |
|---|---|
| Uji otomatis | 41 lulus, 0 gagal. Log: `test-results.txt`. |
| Halaman | Tujuh entry module dirender pada DOM sebenarnya menggunakan JSDOM, tanpa mengirim formulir. |
| Navigasi | Menu mandiri, Escape, tombol/roda mouse desktop, input/dialog, kontrol zoom, konten panjang, inertia guard, dan gulir asli perangkat sentuh diuji pada simulasi DOM. |
| Pengajuan | Keempat jenis tautan membawa modul. Client portal benar-benar memilih empat formulir secara bergantian pada DOM dengan server stub. |
| Fungsi portal yang dipertahankan | 114 fungsi server dan 58 fungsi client cocok byte per byte dengan hash sumber baseline. |
| Integritas sumber | Sintaks 25 JavaScript dan Apps Script, parse CSS, referensi modul/aset, bahasa, ID, label, dan target ARIA lulus. Hasil: `release-check.json`. |
| Sumber daring | Sembilan tab non-indeks berhasil dibaca dengan pembatasan tiga permintaan serentak; tidak ada kegagalan schema. Resources 159, Workspaces 4, Quick_Access 8, Information 6, Synonyms 30; Agenda/Monev kosong. Realization kosong setelah pengecualian baris contoh. Search_Index dibaca terpisah dan menghasilkan 631 metadata folder. |

Percobaan awal sembilan pembacaan serentak melewati batas waktu di lingkungan pengerjaan. Implementasi akhir memakai maksimum tiga permintaan dan timeout 12 detik per pembacaan. Pembacaan akhir sembilan tab tersebut berhasil. Ini membuktikan kompatibilitas sumber pada saat pemeriksaan, bukan jaminan latensi atau ketersediaan Google Sheets pada semua jaringan.

## Yang belum dibuktikan

Browser QA untuk versi hasil revisi tidak tersedia pada lingkungan pengerjaan. JSDOM tidak menghitung layout, tidak menguji scroll snap browser sesungguhnya, dan tidak membuktikan tampilan di HP. Tidak ada klaim lulus audit WCAG menyeluruh atau Core Web Vitals.

SIPD menolak akses dari jaringan pemeriksaan; pola interaksi dibuat dari tangkapan layar yang diberikan, bukan dari pembacaan kode privat SIPD.

Tidak dilakukan transaksi produksi: unggah/kirim pengajuan, Feedback, email, tindakan operator, pengubahan izin Drive, atau pemulihan data server. Hash identik mempersempit bagian yang berubah, tetapi tidak menggantikan uji proses ujung ke ujung.

## Pemeriksaan singkat setelah pemasangan

1. Desktop 1366×768 dan 1920×1080: gulir satu bagian, uji panah/Page Down/Home/End, tombol posisi, serta bagian yang lebih tinggi daripada layar. Semua informasi harus tetap dapat dicapai.
2. HP lebar 360/390 px dan pembesaran teks: menu, pencarian, kartu, Feedback, dan tombol pengajuan tidak tertutup atau melebar keluar layar.
3. Pustaka: `DPA tidakada 2026` nol hasil; `renja akhr 2026` menunjukkan koreksi; `coretx` menyarankan Coretax. Filter tahun/jenis/ruang kerja langsung berlaku.
4. Klik Ajukan Agenda dan Ajukan Materi Monev: portal membuka formulir terkait. Tombol kembali ke Workspace tetap tersedia dan memperingatkan jika ada input belum dikirim.
5. Jalankan satu pengajuan uji melalui prosedur instansi yang diizinkan untuk memeriksa penerimaan, status, dan email. Jika pengujian memakai produksi, gunakan penandaan uji dan prosedur pembersihan yang berlaku.
6. Periksa data sumber menggunakan akun/pemilik yang berwenang. Bila penanda contoh masih ada, realisasi kosong merupakan perilaku yang disengaja.

Website dan portal tetap memakai label RC/beta. Penguncian v1.0 dapat dilakukan setelah pemeriksaan perangkat dan alur produksi selesai, bukan hanya karena seluruh tes kode lulus.
