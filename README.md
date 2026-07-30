# PEPK Workspace v0.9.5

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan
Dinas Kesehatan Kabupaten Kudus.

## Fokus v0.9.5

**Temukan dokumen kerja dengan lebih cepat.**

Pencarian sekarang memahami tingkat spesifik query:

- query spesifik → hanya folder langsung;
- folder induk + tahun → induk dan isi terdalam;
- folder induk tanpa tahun → daftar periode;
- periode multi-tahun tetap dikenali;
- kalimat alami dan salah ketik sederhana didukung;
- hasil induk yang redundan disembunyikan.

## Sumber aktif

- Google Drive: PEPK WORKSPACE V2
- Spreadsheet ID: `1rSbyazj5MSdRYHgBYLBA7jeMjYKattvRPCG9SKHSxCM`
- Website: `0.9.5`
- Apps Script Workflow: `2.3.1`

## Feedback Pilot 01

Widget **Kirim Masukan** tersedia pada seluruh halaman dan memakai deployment
PEPK Submission Portal yang sama. Backend `v0.2.2-beta` menyimpan masukan pada
`Feedback_Inbox` di PEPK Operations Database V2. Pasang serta aktifkan backend
lebih dahulu sebelum mengunggah paket website.

Lihat `PANDUAN_FEEDBACK_PILOT_01.md` untuk urutan pemasangan dan uji produksi.

## Mobile Access Hotfix 01

Hotfix ini menstabilkan akses Submission Portal dan hamburger pada ponsel:

- Submission dibuka pada tab yang sama;
- menu seluler aktif melalui bootstrap ringan tanpa menunggu data halaman;
- target sentuh hamburger diperbesar;
- cache key website dinaikkan agar Chrome mengambil aset baru.

Tidak ada perubahan pada URL deployment, Apps Script, Feedback Inbox, data,
Referensi, atau Operator Console. Lihat
`PANDUAN_MOBILE_ACCESS_HOTFIX_01.md` untuk pemasangan dan uji produksi.
