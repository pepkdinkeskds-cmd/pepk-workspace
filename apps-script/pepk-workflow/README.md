# PEPK Workflow Apps Script v0.7.0

Gunakan satu file saja: `Code.gs`.

Versi ini sudah mencakup:

- Form unggah dokumen dan agenda.
- Persetujuan melalui `Upload_Inbox` dan `Agenda_Inbox`.
- Routing berdasarkan `folder_id`, bukan teks subfolder.
- Sheet `Upload_Routes` yang disinkronkan dari Google Drive.
- Sinkronisasi manual dan harian.
- Perbaikan ID dan format tanggal agenda lama.
- Pembangunan ulang Form yang aman terhadap navigasi antarbagian.

Untuk instalasi pada project Spreadsheet-bound:

1. Hapus kode lama di `Code.gs`.
2. Salin seluruh isi `Code.gs` pada folder ini.
3. Jalankan `testWorkflowConfiguration` untuk verifikasi.
4. Jalankan `setupPepkWorkflow` hanya jika memang perlu membangun ulang konfigurasi/Form.

## v0.7.0 — Materi Monev

1. Buat Form dengan pertanyaan File upload `File Materi`.
2. Isi `Workflow_Config.monev_form_id`.
3. Jalankan `setupMonevWorkflow`.
4. Uji kiriman dan persetujuan pada `Monev_Inbox`.
