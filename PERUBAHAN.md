# Daftar revisi

Baseline website: sumber publik PEPK Workspace 0.9.6 RC1 yang diperiksa pada 20 Oktober 2026. Baseline server: paket Submission Portal 0.2.2.4-beta. Hasil: website 0.9.7 RC2 dan portal 0.2.2.5-beta.

| Temuan review | Revisi konkret |
|---|---|
| F01: angka contoh aktif | Paket tidak menyertakan agenda, realisasi, atau materi contoh. Baris daring berpenanda contoh dikecualikan dan diberi catatan. Tidak ada angka cadangan contoh sebelum sinkronisasi. |
| F02: kosong dan gagal tercampur | CSV dengan header sah dan tanpa baris diterima sebagai kosong. CSV/HTML tidak sah dan kegagalan jaringan dilaporkan sebagai kegagalan. Salinan lama hanya digunakan dengan asal/waktu pembacaan yang terlihat. Penggabungan migrasi yang menghidupkan data kembali dihapus. |
| F02: kesan data terbaru | Label “Konten terbaru” dihapus. Waktu pembacaan sumber dipisahkan dari periode pada kartu data. Catatan sumber per komponen dan pembatasan indeks tampil. |
| F03: evaluasi menyimpulkan “Sesuai” | Tanpa target, tampilan menjelaskan selisih dan toleransi; tidak menyatakan target tercapai. Jika kedua target periode tersedia, hasil dapat dibandingkan terhadap keduanya. Nilai yang hilang tidak berubah menjadi nol. |
| F04: constraint pencarian hilang | Jalur kategori+tahun tidak dijalankan jika ada syarat lain yang belum cocok. Koreksi ejaan folder/aplikasi dijelaskan kepada pengguna. |
| F05: akhir masa berlaku dianggap terbaru | Urutan awal mengutamakan periode aktif, kemudian tahun mulai terbaru; periode masa depan ditempatkan setelah arsip. Akhir masa berlaku tidak digunakan sebagai tanggal pembaruan. Pilihan tahun menjelaskan cakupan dokumen jangka panjang. |
| Judul hasil berulang | Jalur cabang menjadi bagian judul hasil langsung, misalnya DPA · 2026 · PERGESERAN · SUDAH TTD. |
| Lingkup pencarian tidak jelas | Label mencari folder/aplikasi dan catatan bahwa isi berkas tidak diindeks. Pencarian beranda menuju satu halaman hasil agar tidak ada hitungan ringkas yang membingungkan. |
| Akses cepat seolah berbasis statistik | Bagian beranda diberi nama “Akses utama”; daftar tetap berasal dari kurasi Quick_Access. |
| Nol sebelum modul siap | Penanda memuat pada HTML, terpisah dari hasil nol yang dihitung setelah data dimuat. Pesan pemulihan mandiri jika modul tidak selesai. |
| Filter ganda | Filter otomatis; tombol Terapkan yang berulang dihapus. Enter pada form tetap dapat digunakan. |
| Modul tujuan pengajuan hilang | `?module=document`, `reference`, `agenda`, atau `monev` dikirim website dan divalidasi di server. Client portal membuka formulir yang dipilih. Nilai lain kembali ke Dokumen. |
| Diagnostik masuk alur pengguna | Status pengguna portal disederhanakan. Kode cache dan durasi tidak lagi tampil pada status/toast utama. Diagnostik pengelola tetap tersedia. |
| CSS bertumpuk dan menu ganda | Stylesheet bersama ditulis ulang berdasarkan komponen dan breakpoint; implementasi menu kanonis tetap pada script mandiri. Versi seluruh rantai import diseragamkan. |
| Data awal besar | Katalog awal 121.788 byte mentah, dari 996.047 byte sebelumnya. Indeks 631 folder dipisah dan baru dimuat ketika Pustaka dipakai mencari. |
| Banyak pembacaan sheet | Pembacaan mengikuti kebutuhan halaman, cache per komponen berlaku lima menit, maksimum tiga pembacaan serentak. Tidak semua halaman membaca sepuluh tab. |
| Batas publik/internal kabur | Halaman Tentang menjelaskan katalog publik dan izin Drive. Tidak ditambahkan login semu pada halaman statis. |
| Permintaan interaksi SIPD | Lima bagian beranda memakai perpindahan layar desktop, kontrol posisi, pengaman input/dialog, dan gulir alami pada perangkat sentuh. |

CSS bersama berukuran 36.601 byte mentah, dibanding 116.695 byte pada sumber yang diaudit. Ukuran mentah ini bukan ukuran transfer terkompresi atau skor performa pengguna.

Hero beranda tetap satu layar mengikuti permintaan terbaru. Hero halaman kerja dipadatkan. Portal Penilaian Puskesmas tidak dibangun atau ditambahkan dalam rilis ini.

## Batas perubahan

Paket tidak mengubah deployment aktif, struktur folder Drive, izin akun, spreadsheet produksi, alur pemeriksaan Operator Console, atau layanan email. Hotfix portal menambahkan pemilihan modul dan menyederhanakan pesan; fungsi transaksi yang di luar perubahan terencana diperiksa terhadap hash baseline. Hal tersebut bukan sertifikasi seluruh backend.

Snapshot per komponen membantu penelusuran asal, tetapi tidak menjadikan beberapa pembacaan CSV sebagai satu transaksi atomik. Untuk mengubah kebijakan akses katalog, menetapkan pemilik/tenggat data, atau mengesahkan angka, diperlukan keputusan pengelola. Paket tidak membuat keputusan organisasi tersebut secara fiktif.
