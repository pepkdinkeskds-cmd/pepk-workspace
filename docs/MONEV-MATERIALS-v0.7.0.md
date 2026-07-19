# Materi Monev v0.7.0

## Alur

1. Bidang atau Puskesmas mengirim materi melalui Google Form.
2. File masuk ke `Monev_Inbox` dengan status `Menunggu`.
3. Administrator mengubah status menjadi `Disetujui` atau `Ditolak`.
4. File yang disetujui dipindahkan ke folder tahun/bulan/jenis pengirim/unit.
5. Metadata diterbitkan pada `Monev_Materials` dan tampil pada `monev.html`.

## Struktur folder

```text
MONEV CAPAIAN ANGGARAN
└── 2026
    └── 07 Juli
        ├── 01 Bidang
        │   └── Nama Bidang
        └── 02 Puskesmas
            └── Nama Puskesmas
```

Folder utama Monev dapat dibagikan sebagai Viewer kepada operator dan staf yang membutuhkan.
