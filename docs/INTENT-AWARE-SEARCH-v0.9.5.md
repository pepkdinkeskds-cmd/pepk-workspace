# PEPK Workspace v0.9.5 — Intent-Aware Search

## Tujuan

Mesin pencarian menyesuaikan hasil berdasarkan tingkat spesifik query, bukan
sekadar menampilkan seluruh kartu yang mengandung kata serupa.

## Aturan utama

### Query folder terdalam yang spesifik

Pencarian:

`rancangan akhir renja`

Hasil:

- RANCANGAN AKHIR — RENJA 2027
- RANCANGAN AKHIR — RENJA PERUBAHAN 2027
- RANCANGAN AKHIR — RENJA 2026
- RANCANGAN AKHIR — RENJA PERUBAHAN 2026
- RANCANGAN AKHIR — RENJA 2025
- RANCANGAN AKHIR — RENJA PERUBAHAN 2025

Kartu induk RENJA disembunyikan.

### Query folder induk dan tahun

Pencarian:

`renja 2026`

Hasil:

1. RENJA 2026 — Folder induk
2. DATA PENDUKUNG — RENJA 2026
3. RANCANGAN AKHIR — RENJA 2026
4. RANCANGAN AWAL — RENJA 2026

### Query jalur menengah yang spesifik

Pencarian:

`dpa pergeseran 2026`

Hasil hanya folder terdalam di bawah jalur PERGESERAN, tanpa kartu induk DPA.

### Query folder induk tanpa tahun

Pencarian:

`renja`

Menampilkan folder RENJA dan RENJA PERUBAHAN per tahun, tanpa membuka seluruh
folder terdalam.

### Periode multi-tahun

Pencarian:

`renstra 2026`

Tetap menemukan periode yang mencakup 2026, misalnya 2024–2026 dan 2025–2029.

### Aplikasi

Pencarian tepat seperti `Coretax` hanya menampilkan aplikasi Coretax.

### Kalimat alami

`saya mencari rancangan akhir renja tahun 2026`

dipahami sebagai:

`rancangan akhir renja 2026`

### Salah ketik sederhana

`rancagan akhir renja`

tetap menemukan RANCANGAN AKHIR melalui toleransi salah ketik, tetapi hanya
ketika pencarian normal tidak menghasilkan kecocokan.

## Penanda kartu

- `FOLDER LANGSUNG`: membuka folder tujuan paling spesifik.
- `FOLDER INDUK`: membuka folder tahun/periode dan diikuti isi terdalamnya.
- `APLIKASI`: membuka sistem eksternal.

## Instalasi

1. Ekstrak `pepk-workspace-v0.9.5-intent-search-patch.zip`.
2. Unggah seluruh isinya ke root repository GitHub.
3. Timpa file versi sebelumnya.
4. Gunakan commit:

   `feat(search): terapkan intent-aware search v0.9.5`

5. Tunggu GitHub Pages selesai.
6. Tekan Ctrl+F5 atau Ctrl+Shift+R.

Tidak perlu menjalankan ulang Apps Script, Folder Builder, atau Search_Index.
