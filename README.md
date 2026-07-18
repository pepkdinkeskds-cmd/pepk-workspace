# PEPK Workspace

Workspace internal Sub Bagian Perencanaan, Evaluasi, Pelaporan dan Keuangan, Dinas Kesehatan Kabupaten Kudus.

## Menjalankan secara lokal

Karena menggunakan ES Modules, jalankan melalui local server:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Sumber data

Aplikasi membaca enam sheet Google Sheets:
`Resources`, `Workspaces`, `Quick_Access`, `Information`, `Synonyms`, dan `Settings`.

Spreadsheet ID sudah tersimpan pada `js/config/app.js`.
Jika sheet masih kosong atau gagal dimuat, aplikasi menggunakan data contoh agar UI tetap dapat direview.

## Deploy GitHub Pages

1. Upload seluruh isi folder ini ke root branch `main`.
2. Buka **Settings → Pages**.
3. Pilih **Deploy from a branch**.
4. Pilih branch `main` dan folder `/ (root)`.
5. Simpan dan tunggu proses deployment.
