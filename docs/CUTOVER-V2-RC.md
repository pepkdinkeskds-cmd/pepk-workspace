# Panduan Cutover PEPK Workspace V2 — Release Candidate

## Paket

- `PEPK_Workspace_Data_V2_RC.xlsx`
- `PEPK_Workflow_V2_RC.gs`
- Master folder selesai: `PEPK_Master_Struktur_Folder_V2_COMPLETED.xlsx`

## Hasil yang telah disiapkan

- 4 Ruang Kerja tetap dipertahankan pada tampilan.
- Document Center dimasukkan ke Pustaka sebagai kategori **Referensi**.
- Resources membuka folder pada tingkat tahun atau periode.
- Folder_Index memuat 912 Folder ID dan URL V2.
- Upload_Routes memuat 656 folder tujuan leaf dan tidak memasukkan Document Center.
- Workflow V2 tidak membuat folder Monev tambahan.
- Materi Monev dipindahkan langsung ke:
  `EVALUASI / MONEV KINERJA DAN ANGGARAN / {year} / PELAKSANAAN PROGRAM KEGIATAN APBD / ANGGARAN`

## Langkah 1 — Unggah spreadsheet data V2

1. Unggah `PEPK_Workspace_Data_V2_RC.xlsx` ke Google Drive.
2. Buka sebagai Google Spreadsheet.
3. Beri nama `PEPK Workspace Data V2`.
4. Simpan Spreadsheet ID dari URL.

Jangan mengganti nama sheet.

## Langkah 2 — Atur akses spreadsheet

Spreadsheet menjadi sumber CSV website. Atur izin Viewer sesuai kebijakan Dinas.
Folder Drive tetap mengikuti izin Drive masing-masing.

## Langkah 3 — Buat Form unggah V2

1. Buat Google Form baru.
2. Nama: `PEPK — Unggah Dokumen V2`.
3. Tambahkan satu pertanyaan **Upload file**.
4. Judul pertanyaan harus persis: `File Dokumen`.
5. Salin Form ID ke `Workflow_Config → upload_form_id`.

## Langkah 4 — Buat Form Materi Monev V2

1. Buat Google Form baru.
2. Nama: `PEPK — Unggah Materi Monev V2`.
3. Tambahkan satu pertanyaan **Upload file**.
4. Judul pertanyaan harus persis: `File Materi`.
5. Salin Form ID ke `Workflow_Config → monev_form_id`.

## Langkah 5 — Pasang Apps Script

1. Buka `Ekstensi → Apps Script`.
2. Hapus kode contoh.
3. Tempel seluruh isi `PEPK_Workflow_V2_RC.gs`.
4. Simpan.
5. Kembali ke Google Sheets dan muat ulang.

Menu `PEPK Workflow` akan muncul.

## Langkah 6 — Jalankan setup

1. Pilih `PEPK Workflow → Jalankan setup`.
2. Berikan izin.
3. Script akan:
   - membaca Folder_Index;
   - mengisi ulang Upload_Routes;
   - menyusun Form berdasarkan Ruang Kerja dan Kelompok Dokumen;
   - membuat Form Agenda;
   - membuat folder operasional Workflow V2;
   - memasang trigger.

Setelah itu pilih:

`PEPK Workflow → Setup Materi Monev`

## Langkah 7 — Pemeriksaan wajib

Target:

- `Upload_Routes`: 656 rute aktif.
- `document_upload_form_url`: terisi.
- `agenda_submit_form_url`: terisi.
- `monev_material_form_url`: terisi.
- `workflow_version`: 2.0.0.
- Tidak ada folder baru bernama `MONEV CAPAIAN ANGGARAN`.

## Langkah 8 — Pengujian

1. Unggah satu dokumen Perencanaan.
2. Setujui pada Upload_Inbox.
3. Pastikan file berpindah ke Folder ID V2.
4. Uji satu dokumen dari Evaluasi, Pelaporan, dan Keuangan.
5. Uji penolakan.
6. Uji Agenda sampai Dipublikasikan.
7. Uji Materi Monev sampai muncul pada Monev_Materials.

## Langkah 9 — Kirim Spreadsheet ID V2

Setelah setup dan pengujian dasar berhasil, kirim Spreadsheet ID V2.
Tahap berikutnya adalah paket website v0.9.0 yang:
- membaca Spreadsheet V2;
- mendukung periode multi-tahun;
- menampilkan Document Center sebagai Referensi;
- tidak mengubah desain halaman.
