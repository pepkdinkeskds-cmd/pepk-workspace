# Setup Materi Monev PEPK Workspace v0.7.0

## 1. Jangan mengganti Spreadsheet aktif

Spreadsheet aktif yang sudah mempunyai `Upload_Routes`, Form Dokumen, dan Form Agenda tetap digunakan. Script akan menambahkan sheet dan konfigurasi Materi Monev secara otomatis.

## 2. Buat Form Materi Monev

1. Buka Google Drive menggunakan akun administrator PEPK.
2. Buat **Google Formulir kosong**.
3. Beri nama: `PEPK — Unggah Materi Monev`.
4. Ubah pertanyaan pertama menjadi tipe **Upload file**.
5. Judul pertanyaan: `File Materi`.
6. Aktifkan **Wajib diisi**.
7. Jenis file yang disarankan: PDF, dokumen, presentasi, dan spreadsheet.
8. Maksimum file yang disarankan: 10 file.
9. Publikasikan Form jika tombol Publikasikan tersedia.
10. Salin ID Form dari URL edit di antara `/d/` dan `/edit`.

## 3. Ganti Code.gs

1. Buka Spreadsheet PEPK Workspace.
2. Pilih **Ekstensi → Apps Script**.
3. Buka `Code.gs`.
4. Salin kode lama ke Notepad sebagai cadangan.
5. Hapus seluruh kode lama.
6. Salin seluruh isi `PEPK_Workflow_Complete_v0.7.0.gs.txt`.
7. Tempel ke `Code.gs` dan simpan.

## 4. Buat konfigurasi awal

1. Di dropdown fungsi Apps Script pilih `setupMonevWorkflow`.
2. Jalankan satu kali. Jika `monev_form_id` belum ada, fungsi akan membuat baris konfigurasi lalu meminta ID Form.
3. Kembali ke sheet `Workflow_Config`.
4. Isi nilai `monev_form_id` dengan ID Form yang sudah disalin.
5. Jalankan kembali `setupMonevWorkflow`.
6. Berikan izin Google Forms, Drive, dan Spreadsheet jika diminta.

Setelah berhasil, script akan:
- melengkapi pertanyaan Form Materi Monev;
- membuat sheet `Monev_Inbox` dan `Monev_Materials`;
- membuat folder `01_MONEV_INBOX`;
- membuat folder `MONEV CAPAIAN ANGGARAN` di folder utama Evaluasi;
- memasang trigger Form;
- mengisi `monev_material_form_url` di sheet Settings.

## 5. Uji pengiriman

Isi Form dengan contoh:
- Tahun: 2026
- Bulan: 07 Juli
- Tanggal rapat: tanggal rapat mendatang
- Jenis pengirim: Bidang
- Nama unit: Bidang Kesehatan Masyarakat
- Nama PIC/Penyaji: nama staf
- Judul materi: Capaian Anggaran Juli 2026
- Urutan presentasi: 1
- File: satu PDF atau PowerPoint percobaan

Setelah dikirim:
1. Buka `Monev_Inbox`.
2. Pastikan status awal `Menunggu`.
3. Ubah satu sel status menjadi `Disetujui`.
4. Status harus berubah menjadi `Dipublikasikan`.
5. Data baru harus muncul pada `Monev_Materials`.
6. File harus berada di:

```text
MONEV CAPAIAN ANGGARAN
└── 2026
    └── 07 Juli
        └── 01 Bidang
            └── Bidang Kesehatan Masyarakat
```

## 6. Hak akses

Bagikan folder `MONEV CAPAIAN ANGGARAN` sebagai **Viewer** kepada operator/asisten sorot dan staf yang membutuhkan. Pengunggah tetap menggunakan Form dan tidak memerlukan akses Editor.

## 7. Deploy website

Unggah seluruh isi `pepk-workspace-v0.7.0.zip` ke root repository GitHub dan timpa versi sebelumnya. Setelah GitHub Pages diperbarui, menu Layanan akan memiliki layanan ketiga dan halaman `monev.html` akan tersedia.
