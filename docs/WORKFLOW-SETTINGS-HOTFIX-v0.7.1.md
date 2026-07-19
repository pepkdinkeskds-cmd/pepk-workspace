# Workflow Settings Hotfix v0.7.1

Perbaikan ini menangani kondisi saat footer menunjukkan **Data tersinkron**, tetapi kartu Layanan tetap menampilkan formulir belum dikonfigurasi.

Penyebab: modul `data-service.js` dapat tersimpan dalam cache browser tanpa revision query, sehingga pemetaan key URL formulir memakai versi lama.

Perbaikan:
- cache-busting import `data-service.js`;
- normalisasi key Settings;
- pembersihan whitespace dan karakter tak terlihat pada URL;
- revision query baru pada entry module halaman terkait.
