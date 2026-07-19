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

Agenda yang telah selesai otomatis tidak muncul pada homepage.

## Realization

Isi satu baris untuk setiap bulan. Nilai keuangan dan fisik disarankan berupa capaian kumulatif tahun berjalan.

Kolom utama:

- `id`: kode unik, contoh `realisasi-2026-07`.
- `year`: tahun data, contoh `2026`.
- `month`: nomor bulan `1` sampai `12`.
- `financial_value`: realisasi keuangan dalam persen.
- `physical_value`: capaian fisik dalam persen.
- `deviation_preview`: dihitung otomatis oleh Excel sebagai fisik dikurangi keuangan; tidak perlu diedit.
- `updated_at`: format `YYYY-MM-DD`.
- `description`: catatan singkat.
- `is_active`: `TRUE` agar tampil.

PEPK Workspace menghitung deviasi secara mandiri menggunakan rumus:

```text
deviasi = capaian fisik - realisasi keuangan
```

Bulan yang belum memiliki data sebaiknya dinonaktifkan, bukan diisi nol.
