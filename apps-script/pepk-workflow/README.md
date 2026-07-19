# PEPK Workflow Apps Script v0.6.0

Project ini ditempelkan pada Google Spreadsheet **PEPK Workspace Data** melalui **Ekstensi → Apps Script**.

## Fungsi

- Menerima dokumen dari Google Form tanpa memberi PIC akses Editor ke Drive.
- Menyimpan seluruh kiriman pada `Upload_Inbox`.
- Memindahkan dokumen setelah administrator memilih status `Disetujui`.
- Menerima agenda pada `Agenda_Inbox`.
- Menerbitkan agenda ke sheet `Agenda` setelah disetujui.

Ikuti panduan lengkap pada `docs/WORKFLOW-SETUP.md` di paket website.


## Cara termudah memasang

Buka `PEPK_Workflow_Complete.gs.txt`, salin seluruh isinya, lalu tempel ke `Code.gs` pada project Apps Script yang terikat ke Spreadsheet.
