# PEPK Workflow v0.7.0 — Rute Folder Terkontrol

Patch ini menghapus isian bebas **Subfolder / Jenis Dokumen** dan menggantinya dengan pilihan folder yang dibaca langsung dari struktur Google Drive.

## Yang berubah

- Menambahkan sheet `Upload_Routes` secara otomatis.
- Membaca folder tahun dari `Resources`.
- Membaca subfolder di bawah folder tahun sampai 3 tingkat.
- Membuat pilihan Google Form per Ruang Kerja.
- Menyimpan `folder_id` pada `Upload_Inbox`, sehingga persetujuan tidak bergantung pada penulisan nama folder.
- Menambahkan menu `PEPK Workflow → Sinkronkan struktur folder`.
- Menambahkan sinkronisasi otomatis setiap hari sekitar pukul 03.00.
- Tetap mendukung baris lama v0.6.0 sebagai fallback.

## Cara memasang

1. Jangan impor ulang Spreadsheet dan jangan membuat Form baru.
2. Buka Spreadsheet PEPK Workspace Data.
3. Pilih `Ekstensi → Apps Script`.
4. Buka `Code.gs`, tekan `Ctrl+A`, lalu hapus kode lama.
5. Salin seluruh isi `PEPK_Workflow_Complete_v0.7.0.gs.txt` ke `Code.gs`.
6. Simpan.
7. Pilih fungsi `setupPepkWorkflow` lalu klik **Jalankan**.
8. Setujui izin jika diminta.
9. Tunggu sampai log menampilkan **Eksekusi selesai**.
10. Refresh Spreadsheet.

## Hasil yang harus terlihat

- Sheet baru `Upload_Routes` terisi.
- Menu baru `Sinkronkan struktur folder` tersedia.
- Form Unggah Dokumen tidak lagi memiliki isian bebas subfolder.
- Setelah memilih `Ruang Kerja`, pengguna diarahkan ke bagian yang berisi pilihan `Tujuan Folder`.
- `Upload_Inbox` memperoleh kolom tambahan `route_id`, `folder_id`, dan `destination_label`.

## Ketika folder Drive berubah

Jalankan:

`PEPK Workflow → Sinkronkan struktur folder`

Pilihan Form akan diperbarui. Sistem juga menjalankan sinkronisasi otomatis harian.

## Pengujian

1. Buka Form Unggah Dokumen.
2. Pilih Ruang Kerja `Perencanaan`.
3. Pilih tujuan seperti `RENJA 2027 › Awal`.
4. Unggah satu PDF percobaan.
5. Pastikan baris baru masuk ke `Upload_Inbox` dengan `folder_id` terisi.
6. Ubah status menjadi `Disetujui`.
7. Status harus berubah menjadi `Selesai` dan file berpindah ke folder yang dipilih.

## Baris pengujian lama

Baris lama yang berstatus `Perlu penempatan` masih dapat diproses dengan mengubah `subfolder` menjadi nama yang benar, misalnya `Awal`, lalu mengubah status kembali menjadi `Disetujui`. Baris baru tidak lagi menggunakan isian bebas tersebut.
