# PEPK Workspace v0.4.1

Patch pemulihan koneksi data untuk PEPK Workspace.

## Perubahan versi 0.4.1

- Mengganti sumber data Google Sheets ke spreadsheet baru.
- Mempertahankan seluruh fitur v0.4.0 tanpa perubahan desain atau struktur data.
- Memperbarui parameter versi aset agar browser tidak memakai cache versi lama.

## Spreadsheet aktif

PEPK Workspace membaca spreadsheet dengan ID:

```text
1eEYRJmxYqqZuXABbQL2cCcKKeOt1ENk9mt_S7LgKfno
```

Spreadsheet harus memiliki sheet berikut:

```text
Resources
Workspaces
Quick_Access
Information
Synonyms
Settings
Agenda
Realization
```

Pastikan akses spreadsheet menggunakan **Siapa saja yang memiliki link → Pelihat**.

## Upload ke GitHub

1. Ekstrak ZIP.
2. Unggah seluruh isi folder ke root repository `pepk-workspace`.
3. Timpa file versi sebelumnya.
4. Commit dengan pesan `fix(data): hubungkan spreadsheet baru pada v0.4.1`.
5. Tunggu GitHub Pages memperbarui situs.
6. Buka ulang situs menggunakan `Ctrl + F5`.

Tidak perlu mengimpor ulang spreadsheet karena struktur datanya tidak berubah dari v0.4.0.
