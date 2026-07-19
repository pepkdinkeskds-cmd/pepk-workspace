# Pengisian Agenda dan Capaian Realisasi

## Agenda

Isi satu baris untuk setiap rapat atau kegiatan.

Kolom utama:

- `id`: kode unik, contoh `rapat-evaluasi-juli-2026`.
- `title`: nama rapat atau kegiatan.
- `date`: format `YYYY-MM-DD`.
- `start_time` dan `end_time`: format `HH:MM`.
- `category`: Internal, Eksternal, Daring, atau Kegiatan.
- `location`: ruang rapat, instansi tujuan, atau media daring.
- `pic`: nama staf yang menjadi PIC.
- `url`: opsional, dapat berupa tautan undangan atau bahan rapat.
- `is_active`: `TRUE` agar tampil.

Agenda yang telah selesai otomatis tidak muncul pada homepage. Baris tetap dapat dinonaktifkan melalui `is_active`.

## Realization

Isi satu baris untuk setiap indikator utama.

Kolom utama:

- `id`: kode unik.
- `title`: nama indikator.
- `value`: capaian saat ini.
- `target`: target periode.
- `unit`: `%`, Dokumen, Kegiatan, atau Program.
- `period`: contoh `Juli 2026` atau `Triwulan II 2026`.
- `updated_at`: format `YYYY-MM-DD`.
- `description`: penjelasan singkat.
- `is_active`: `TRUE` agar tampil.

Homepage disarankan menampilkan maksimal empat indikator agar tetap ringkas.
