# Setup PEPK Workflow v0.6.0

Panduan ini dilakukan satu kali oleh administrator. Setelah selesai, PIC dapat mengirim dokumen dan agenda tanpa akses Editor ke folder utama.

## Hasil akhir

- Form **PEPK — Unggah Dokumen**.
- Form **PEPK — Tambah Agenda**.
- Dokumen masuk ke `Upload_Inbox`.
- Agenda masuk ke `Agenda_Inbox`.
- Administrator menyetujui atau menolak melalui dropdown `status`.
- Website otomatis membaca URL formulir dari sheet `Settings`.

---

## Langkah 1 — Import data v0.6.0

Import `PEPK_Workspace_Data_v0.6.0.xlsx` ke Google Spreadsheet PEPK Workspace dengan pilihan **Ganti spreadsheet**.

Pastikan terdapat sheet:

- `Workflow_Config`
- `Upload_Inbox`
- `Agenda_Inbox`

## Langkah 2 — Buat form unggah dokumen

1. Buka Google Forms dan buat formulir kosong.
2. Beri nama **PEPK — Unggah Dokumen**.
3. Tambahkan satu pertanyaan bertipe **File upload**.
4. Judul pertanyaan harus persis: **File Dokumen**.
5. Aktifkan **Wajib diisi**.
6. Atur jenis dan jumlah file sesuai kebutuhan, misalnya PDF, Word, dan Excel.
7. Publikasikan formulir.
8. Salin ID form dari URL edit:

```text
https://docs.google.com/forms/d/ID_FORM/edit
```

9. Tempel ID tersebut pada:

```text
Workflow_Config → upload_form_id
```

Kolom pertanyaan lain akan dibuat otomatis oleh Apps Script.

## Langkah 3 — Pasang Apps Script

1. Pada Google Spreadsheet pilih **Ekstensi → Apps Script**.
2. Hapus kode contoh.
3. Buka file `apps-script/pepk-workflow/PEPK_Workflow_Complete.gs.txt`.
4. Salin seluruh isinya dan tempel ke file `Code.gs` di Apps Script.
5. Buka **Project Settings** dan pastikan zona waktu `Asia/Jakarta`.
6. Simpan project dengan nama **PEPK Workflow**.

Alternatif untuk pengembang: kode yang sama juga tersedia terpisah dalam `Code.gs` dan `Setup.gs`.

## Langkah 4 — Jalankan setup

1. Pilih fungsi `setupPepkWorkflow`.
2. Klik **Run/Jalankan**.
3. Setujui permintaan izin Google Forms, Drive, dan Spreadsheet.
4. Kembali ke Spreadsheet.
5. Menu baru **PEPK Workflow** akan tersedia.

Setup akan:

- menyiapkan pertanyaan Form unggah;
- membuat Form agenda;
- membuat folder `PEPK Workspace Workflow/00_UPLOAD_INBOX`;
- membuat folder `99_DITOLAK`;
- memasang trigger pengiriman dan persetujuan;
- mengisi URL formulir ke sheet `Settings`.

## Langkah 5 — Lakukan pengujian

### Uji dokumen

1. Buka Form unggah.
2. Kirim satu file percobaan.
3. Periksa `Upload_Inbox`.
4. Ubah `status` menjadi **Disetujui**.
5. Script akan mencari folder tahun pada `Resources`.
6. Jika subfolder ditemukan, file dipindahkan dan status menjadi **Selesai**.
7. Jika subfolder tidak ditemukan, status menjadi **Perlu penempatan**.

### Uji agenda

1. Buka Form agenda.
2. Kirim satu agenda percobaan.
3. Periksa `Agenda_Inbox`.
4. Ubah `status` menjadi **Disetujui**.
5. Agenda disalin ke sheet `Agenda` dengan `is_active = TRUE`.
6. Refresh PEPK Workspace.

## Status yang digunakan

### Upload_Inbox

- `Menunggu`
- `Disetujui`
- `Ditolak`
- `Perlu penempatan`
- `Selesai`

### Agenda_Inbox

- `Menunggu`
- `Disetujui`
- `Ditolak`
- `Dipublikasikan`

## Penggunaan melalui WhatsApp

Setelah setup, salin URL form dari sheet `Settings`:

- `document_upload_form_url`
- `agenda_submit_form_url`

Kedua URL dapat dikirim atau disematkan pada grup WhatsApp. WhatsApp hanya menjadi pintu masuk menuju formulir; pesan biasa belum diproses otomatis pada v0.6.0.

## Catatan keamanan

- PIC tidak perlu menjadi Editor folder utama.
- Script berjalan menggunakan akun administrator yang memasang trigger.
- File tidak dipublikasikan langsung tanpa persetujuan.
- Jangan mengubah nama header sheet Inbox atau judul pertanyaan Form.
- File upload Google Forms memerlukan pengguna masuk dengan akun Google.
