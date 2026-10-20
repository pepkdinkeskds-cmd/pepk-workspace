# PEPK Workspace 0.9.7 RC2

Paket revisi website GitHub Pages dan Submission Portal 0.2.2.5-beta, disiapkan 20 Oktober 2026. Portal Penilaian Puskesmas tetap ditangguhkan.

## Isi paket

| Folder | Penggunaan |
|---|---|
| `website/` | **Unggah seluruh isinya ke lokasi website pada repository GitHub yang sekarang.** `index.html`, `js/`, `css/`, dan `assets/` tetap sejajar di root website. |
| `submission-portal/` | Dua sumber untuk project Apps Script Submission Portal yang sekarang. Jangan unggah folder ini ke website. |
| `docs/` | Perubahan, aturan sumber data, hasil validasi, dan pemulihan. |
| `tests/`, `tools/`, `package.json`, `package-lock.json` | Pemeriksaan pengembang; tidak diperlukan untuk menjalankan website. |

Website tetap berupa HTML/CSS/JavaScript statis. Tidak memerlukan build, database baru, token GitHub, atau server tambahan.

## Pemasangan

1. Simpan backup repository/deployment yang sedang dipakai. Gunakan commit tersendiri untuk rilis ini agar mudah dipulihkan.
2. Pada project Apps Script Submission Portal aktif, ganti **`SubmissionPortal.gs` dan `SubmissionPortalView.html`** dari `submission-portal/`. File script lainnya tetap mengikuti project yang sekarang.
3. Simpan. Jalankan `onOpen` atau muat ulang Structure Registry. Pilih **Hotfix tautan modul v0.2.2.5**, kemudian **Diagnostik tautan modul v0.2.2.5**. Hasil yang diperlukan: `LULUS`, gagal `0`. Hotfix memperbarui identitas dan cache; status pengiriman yang sudah ada dipertahankan.
4. Di Apps Script: **Deploy → Manage deployments → deployment aktif → Edit → New version → Deploy**. Pertahankan deployment dan URL `/exec` yang sama.
5. Unggah/commit **isi `website/`**, termasuk semua berkas JavaScript dan CSS versi ini, ke lokasi GitHub Pages PEPK saat ini. Jangan hanya mengganti `index.html`. Jangan menaruh seluruh folder paket pada root website.
6. Tunggu publikasi GitHub Pages selesai, lalu buka `index.html` dengan refresh penuh. Footer harus menampilkan **0.9.7 RC2**. Pada portal, footer harus menampilkan **0.2.2.5-beta**.

Pembaruan portal dipasang terlebih dahulu agar tombol Agenda/Monev langsung memilih formulir yang sesuai. Paket ini belum dipasang ke GitHub atau Apps Script produksi oleh penyusun.

## Perilaku beranda

Lima bagian: **Mulai → Akses utama → Ruang kerja → Agenda → Realisasi**.

- Desktop dengan mouse/trackpad: gulir untuk berpindah satu bagian, atau gunakan `↑`, `↓`, `Page Up`, `Page Down`, `Home`, dan `End` saat fokus berada pada konten biasa. Tombol navigasi bawah dan indikator posisi juga tersedia.
- Konten yang lebih panjang daripada layar tetap dapat digulir hingga selesai. Gerakan horizontal, zoom browser, input, kontrol formulir, dan dialog tidak diambil alih.
- HP/tablet dengan sentuhan memakai gulir alami. Preferensi reduced motion memakai perpindahan tanpa animasi.
- Pencarian beranda membuka Pustaka dengan kata pencarian yang sama. Hasil subfolder dimuat saat diperlukan, bukan pada setiap pembukaan beranda.

Pola perpindahan mengikuti contoh tangkapan layar SIPD yang diberikan. Identitas, logo, dan konteks kerja tetap PEPK.

## Perubahan data yang akan terlihat

**Realisasi dapat tampil “belum tersedia”.** Pada pembacaan sumber publik saat pengerjaan, baris realisasi masih memuat penanda **data contoh**. Rilis ini mengecualikannya dari tampilan. Penyusun tidak mengganti angka, menghapus baris sumber, atau menyatakan angka tersebut sudah terverifikasi.

Operator perlu memeriksa angka dan metadata melalui proses publikasi yang berlaku sebelum menerbitkan data resmi. Menghapus kata “contoh” tanpa memeriksa data bukan verifikasi. Panduan rinci ada di `docs/DATA_DAN_OPERASI.md`.

## Pemeriksaan yang disertakan

**41 uji otomatis lulus**, meliputi logika data, pencarian, realisasi, DOM tujuh halaman, menu, navigasi bagian, Feedback tanpa kirim, serta pemilihan empat modul portal. Pemeriksaan referensi modul/aset, sintaks JavaScript/Apps Script, dan parse CSS juga lulus. Sebanyak **114 fungsi server** dan **58 fungsi client portal** yang berada di luar perubahan terencana tetap identik dengan baseline.

Uji DOM menggunakan JSDOM; ini tidak menggantikan pengujian tampilan pada browser. Uji visual browser/perangkat, Core Web Vitals, unggah/kirim pengajuan, email, izin Drive, dan pemulihan server produksi belum dijalankan. Lihat `docs/VALIDASI.md` untuk batas bukti dan pemeriksaan singkat setelah pemasangan.

Untuk menjalankan ulang pemeriksaan kode, gunakan Node.js 22 atau lebih baru:

```bash
npm ci
npm test
npm run check
```

## Pemulihan

Jika terjadi masalah, kembalikan commit website sebelum rilis ini. Di Apps Script, edit deployment aktif dan pilih versi sebelumnya; jangan membuat URL pengganti. Pengubahan versi website/portal tidak mengembalikan isi spreadsheet atau file Drive. Gunakan backup data instansi jika yang perlu dipulihkan adalah data.
