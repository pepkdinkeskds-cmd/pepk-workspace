# PEPK Workspace v0.7.0

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan, Dinas Kesehatan Kabupaten Kudus.

## Fitur utama

- Pencarian folder dokumen dan aplikasi.
- Empat Ruang Kerja PEPK.
- Akses cepat folder dan launchpad aplikasi.
- Agenda dan capaian realisasi keuangan/fisik.
- Layanan unggah dokumen tanpa akses Editor.
- Tujuan unggah dipilih dari rute folder Google Drive yang valid.
- Pengajuan agenda melalui formulir dan persetujuan administrator.
- Sinkronisasi struktur folder manual dan terjadwal.

## Teknologi

- GitHub Pages
- HTML, CSS, Vanilla JavaScript
- Google Sheets dan Google Drive
- Google Forms dan Google Apps Script untuk workflow layanan

## Upgrade dari v0.6.0

1. Jangan mengganti Spreadsheet yang sudah dikonfigurasi.
2. Pastikan Apps Script menggunakan `apps-script/pepk-workflow/Code.gs` versi 0.7.0.
3. Unggah seluruh isi folder ini ke root repository GitHub.
4. Lakukan `Ctrl + F5` setelah GitHub Pages selesai diperbarui.

## Instalasi baru

Gunakan template data di folder `docs`, lalu ikuti `docs/WORKFLOW-SETUP.md` dan `docs/WORKFLOW-ROUTING-v0.7.0.md`.

## URL produksi

`https://pepkdinkeskds-cmd.github.io/pepk-workspace/`

## Materi Monev v0.7.0

- Form khusus materi Monev bulanan.
- Persetujuan administrator dan routing folder otomatis.
- Pustaka materi dengan filter periode, unit, pengirim, dan jenis file.
- Urutan presentasi untuk asisten sorot/operator.
