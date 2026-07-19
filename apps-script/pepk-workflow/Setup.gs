/** Setup and maintenance functions for PEPK Workflow v0.6.0. */

function setupPepkWorkflow() {
  const ui = SpreadsheetApp.getUi();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ensureWorkflowSheets_();

  const config = getWorkflowConfig_();
  const uploadFormId = String(config[PEPK.CONFIG_KEYS.UPLOAD_FORM_ID] || '').trim();
  if (!uploadFormId) {
    ui.alert(
      'Form unggah belum tersedia',
      'Buat Google Form dengan satu pertanyaan File upload berjudul “File Dokumen”. Salin ID form ke Workflow_Config pada baris upload_form_id, lalu jalankan setup kembali.',
      ui.ButtonSet.OK
    );
    return;
  }

  const uploadForm = FormApp.openById(uploadFormId);
  prepareUploadForm_(uploadForm);
  const agendaForm = getOrCreateAgendaForm_(spreadsheet);
  const folders = ensureWorkflowFolders_(spreadsheet);

  setWorkflowConfig_(PEPK.CONFIG_KEYS.UPLOAD_FORM_URL, uploadForm.getPublishedUrl());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.AGENDA_FORM_ID, agendaForm.getId());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.AGENDA_FORM_URL, agendaForm.getPublishedUrl());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.INBOX_FOLDER_ID, folders.inbox.getId());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.REJECTED_FOLDER_ID, folders.rejected.getId());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.INSTALLED_AT, new Date());

  upsertSetting_('app_version', PEPK.VERSION);
  upsertSetting_('workflow_enabled', 'TRUE');
  upsertSetting_('document_upload_form_url', uploadForm.getPublishedUrl());
  upsertSetting_('agenda_submit_form_url', agendaForm.getPublishedUrl());

  installTriggers_(uploadForm, agendaForm, spreadsheet);
  formatWorkflowSheets_();

  ui.alert(
    'PEPK Workflow siap',
    `Form unggah:\n${uploadForm.getPublishedUrl()}\n\nForm agenda:\n${agendaForm.getPublishedUrl()}\n\nTautan telah disimpan pada sheet Settings.`,
    ui.ButtonSet.OK
  );
}

function ensureWorkflowSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const definitions = {
    [PEPK.SHEETS.CONFIG]: ['key', 'value', 'description'],
    [PEPK.SHEETS.UPLOAD_INBOX]: [
      'submission_id', 'submitted_at', 'submitter_email', 'pic', 'workspace_id', 'document_group', 'year', 'subfolder',
      'description', 'file_name', 'file_id', 'file_url', 'status', 'destination_url', 'admin_note', 'processed_at'
    ],
    [PEPK.SHEETS.AGENDA_INBOX]: [
      'submission_id', 'submitted_at', 'submitter_email', 'title', 'date', 'start_time', 'end_time', 'category', 'location',
      'pic', 'description', 'url', 'status', 'published_id', 'admin_note', 'processed_at'
    ]
  };
  Object.entries(definitions).forEach(([name, headers]) => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  });

  const configSheet = ss.getSheetByName(PEPK.SHEETS.CONFIG);
  const existing = getWorkflowConfig_();
  const defaults = [
    [PEPK.CONFIG_KEYS.UPLOAD_FORM_ID, '', 'ID Google Form unggah yang dibuat manual.'],
    [PEPK.CONFIG_KEYS.UPLOAD_FORM_URL, '', 'Diisi otomatis oleh setup.'],
    [PEPK.CONFIG_KEYS.AGENDA_FORM_ID, '', 'Diisi otomatis oleh setup.'],
    [PEPK.CONFIG_KEYS.AGENDA_FORM_URL, '', 'Diisi otomatis oleh setup.'],
    [PEPK.CONFIG_KEYS.INBOX_FOLDER_ID, '', 'Folder antrean unggahan.'],
    [PEPK.CONFIG_KEYS.REJECTED_FOLDER_ID, '', 'Folder dokumen yang ditolak.'],
    [PEPK.CONFIG_KEYS.INSTALLED_AT, '', 'Waktu setup terakhir.']
  ];
  defaults.filter(([key]) => !(key in existing)).forEach((row) => configSheet.appendRow(row));
}

function prepareUploadForm_(form) {
  form.setTitle('PEPK — Unggah Dokumen');
  form.setDescription('Kirim dokumen kerja PEPK tanpa akses Editor ke folder utama. Dokumen masuk ke antrean pemeriksaan administrator.');
  form.setCollectEmail(true);
  form.setConfirmationMessage('Dokumen telah dikirim ke antrean pemeriksaan PEPK.');
  form.setAcceptingResponses(true);

  const workspaces = workspaceChoices_();
  const groups = resourceGroupChoices_();
  const years = resourceYearChoices_();

  ensureTextItem_(form, PEPK.FORM_TITLES.PIC, true, 'Nama staf/PIC yang bertanggung jawab atas dokumen.');
  ensureListItem_(form, PEPK.FORM_TITLES.WORKSPACE, workspaces, true);
  ensureListItem_(form, PEPK.FORM_TITLES.GROUP, groups, true);
  ensureListItem_(form, PEPK.FORM_TITLES.YEAR, years, true);
  ensureTextItem_(form, PEPK.FORM_TITLES.SUBFOLDER, false, 'Contoh: Renja Awal, Perubahan, Data Pendukung. Kosongkan untuk folder tahun.');
  ensureParagraphItem_(form, PEPK.FORM_TITLES.NOTE, false, 'Keterangan singkat isi atau tujuan dokumen.');

  const uploadItem = form.getItems().find((item) => item.getType().toString() === 'FILE_UPLOAD');
  if (!uploadItem) throw new Error('Form unggah harus memiliki pertanyaan File upload berjudul “File Dokumen”.');
  uploadItem.setTitle(PEPK.FORM_TITLES.FILE);
}

function getOrCreateAgendaForm_(spreadsheet) {
  const config = getWorkflowConfig_();
  let form = null;
  const formId = String(config[PEPK.CONFIG_KEYS.AGENDA_FORM_ID] || '').trim();
  if (formId) {
    try { form = FormApp.openById(formId); } catch (error) { form = null; }
  }
  if (!form) form = FormApp.create('PEPK — Tambah Agenda');

  form.setTitle('PEPK — Tambah Agenda');
  form.setDescription('Kirim agenda rapat atau kegiatan. Agenda baru tampil di PEPK Workspace setelah disetujui administrator.');
  form.setCollectEmail(true);
  form.setConfirmationMessage('Agenda telah masuk ke antrean pemeriksaan PEPK.');
  form.setAcceptingResponses(true);

  ensureTextItem_(form, PEPK.FORM_TITLES.AGENDA_TITLE, true, 'Nama rapat atau kegiatan.');
  ensureDateItem_(form, PEPK.FORM_TITLES.DATE, true);
  ensureTimeItem_(form, PEPK.FORM_TITLES.START, true);
  ensureTimeItem_(form, PEPK.FORM_TITLES.END, false);
  ensureListItem_(form, PEPK.FORM_TITLES.CATEGORY, ['Internal', 'Eksternal', 'Daring', 'Kegiatan'], true);
  ensureTextItem_(form, PEPK.FORM_TITLES.LOCATION, true, 'Lokasi rapat atau media daring.');
  ensureTextItem_(form, PEPK.FORM_TITLES.AGENDA_PIC, true, 'Nama staf/PIC yang menangani.');
  ensureParagraphItem_(form, PEPK.FORM_TITLES.DESCRIPTION, false, 'Keterangan singkat atau hal yang perlu disiapkan.');
  ensureTextItem_(form, PEPK.FORM_TITLES.URL, false, 'Tautan undangan, Meet/Zoom, atau bahan rapat.');
  return form;
}

function ensureWorkflowFolders_(spreadsheet) {
  const spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
  const parents = spreadsheetFile.getParents();
  const parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  const root = getOrCreateFolder_(parent, 'PEPK Workspace Workflow');
  return {
    root,
    inbox: getOrCreateFolder_(root, '00_UPLOAD_INBOX'),
    rejected: getOrCreateFolder_(root, '99_DITOLAK')
  };
}

function installTriggers_(uploadForm, agendaForm, spreadsheet) {
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (['onWorkflowFormSubmit', 'onWorkflowEdit'].includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onWorkflowFormSubmit').forForm(uploadForm).onFormSubmit().create();
  ScriptApp.newTrigger('onWorkflowFormSubmit').forForm(agendaForm).onFormSubmit().create();
  ScriptApp.newTrigger('onWorkflowEdit').forSpreadsheet(spreadsheet).onEdit().create();
}

function refreshFormChoices() {
  const config = getWorkflowConfig_();
  if (config[PEPK.CONFIG_KEYS.UPLOAD_FORM_ID]) prepareUploadForm_(FormApp.openById(config[PEPK.CONFIG_KEYS.UPLOAD_FORM_ID]));
  if (config[PEPK.CONFIG_KEYS.AGENDA_FORM_ID]) getOrCreateAgendaForm_(SpreadsheetApp.getActiveSpreadsheet());
  SpreadsheetApp.getUi().alert('Pilihan formulir telah diperbarui dari Workspaces dan Resources.');
}

function testWorkflowConfiguration() {
  const config = getWorkflowConfig_();
  const required = [PEPK.CONFIG_KEYS.UPLOAD_FORM_ID, PEPK.CONFIG_KEYS.AGENDA_FORM_ID, PEPK.CONFIG_KEYS.INBOX_FOLDER_ID];
  const missing = required.filter((key) => !config[key]);
  const message = missing.length ? `Belum lengkap: ${missing.join(', ')}` : 'Konfigurasi utama lengkap. Lakukan satu pengiriman uji untuk memastikan izin dan trigger bekerja.';
  SpreadsheetApp.getUi().alert('Pemeriksaan PEPK Workflow', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

function openUploadForm() { openConfiguredUrl_(PEPK.CONFIG_KEYS.UPLOAD_FORM_URL); }
function openAgendaForm() { openConfiguredUrl_(PEPK.CONFIG_KEYS.AGENDA_FORM_URL); }

function openConfiguredUrl_(key) {
  const url = getWorkflowConfig_()[key];
  if (!url) return SpreadsheetApp.getUi().alert('Tautan belum tersedia. Jalankan setup terlebih dahulu.');
  const html = HtmlService.createHtmlOutput(`<script>window.open(${JSON.stringify(url)}, '_blank');google.script.host.close();</script>`).setWidth(10).setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(html, 'Membuka formulir');
}

function workspaceChoices_() {
  const rows = sheet_(PEPK.SHEETS.WORKSPACES).getDataRange().getDisplayValues();
  if (rows.length < 2) return ['Perencanaan', 'Evaluasi', 'Pelaporan', 'Keuangan'];
  const headers = rows[0].map(normalizeKey_);
  const titleIndex = headers.indexOf('title');
  const activeIndex = headers.indexOf('is_active');
  return rows.slice(1).filter((row) => row[titleIndex] && (activeIndex < 0 || truthy_(row[activeIndex]))).map((row) => row[titleIndex]);
}

function resourceGroupChoices_() {
  const rows = sheet_(PEPK.SHEETS.RESOURCES).getDataRange().getDisplayValues();
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeKey_);
  const titleIndex = headers.indexOf('title');
  const typeIndex = headers.indexOf('type');
  const activeIndex = headers.indexOf('is_active');
  const groups = rows.slice(1)
    .filter((row) => row[titleIndex] && normalizeText_(row[typeIndex]) !== 'application' && (activeIndex < 0 || truthy_(row[activeIndex])))
    .map((row) => String(row[titleIndex]).replace(/\s+20\d{2}\b/, '').trim());
  return [...new Set(groups)].sort((a, b) => a.localeCompare(b, 'id'));
}

function resourceYearChoices_() {
  const rows = sheet_(PEPK.SHEETS.RESOURCES).getDataRange().getDisplayValues();
  const years = rows.flatMap((row) => String(row[1] || '').match(/\b20\d{2}\b/g) || []);
  return [...new Set(years)].sort((a, b) => Number(b) - Number(a));
}

function ensureTextItem_(form, title, required, helpText) {
  let item = findItemByTitle_(form, title);
  if (!item) item = form.addTextItem().setTitle(title);
  const textItem = item.asTextItem();
  textItem.setRequired(Boolean(required));
  if (helpText) textItem.setHelpText(helpText);
  return textItem;
}

function ensureParagraphItem_(form, title, required, helpText) {
  let item = findItemByTitle_(form, title);
  if (!item) item = form.addParagraphTextItem().setTitle(title);
  const paragraphItem = item.asParagraphTextItem();
  paragraphItem.setRequired(Boolean(required));
  if (helpText) paragraphItem.setHelpText(helpText);
  return paragraphItem;
}

function ensureListItem_(form, title, values, required) {
  let item = findItemByTitle_(form, title);
  if (!item) item = form.addListItem().setTitle(title);
  const listItem = item.asListItem();
  listItem.setChoiceValues(values.length ? values : ['Belum tersedia']);
  listItem.setRequired(Boolean(required));
  return listItem;
}

function ensureDateItem_(form, title, required) {
  let item = findItemByTitle_(form, title);
  if (!item) item = form.addDateItem().setTitle(title);
  return item.asDateItem().setRequired(Boolean(required));
}

function ensureTimeItem_(form, title, required) {
  let item = findItemByTitle_(form, title);
  if (!item) item = form.addTimeItem().setTitle(title);
  return item.asTimeItem().setRequired(Boolean(required));
}

function findItemByTitle_(form, title) {
  return form.getItems().find((item) => item.getTitle() === title) || null;
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function formatWorkflowSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [PEPK.SHEETS.CONFIG, PEPK.SHEETS.UPLOAD_INBOX, PEPK.SHEETS.AGENDA_INBOX].forEach((name) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#0F5CC0').setFontColor('#FFFFFF');
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  });

  const upload = ss.getSheetByName(PEPK.SHEETS.UPLOAD_INBOX);
  const uploadHeaders = headerMap_(upload);
  if (uploadHeaders.status) upload.getRange(2, uploadHeaders.status, Math.max(upload.getMaxRows() - 1, 1)).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList([
      PEPK.STATUS.WAITING, PEPK.STATUS.APPROVE, PEPK.STATUS.REJECT, PEPK.STATUS.NEEDS_PLACEMENT, PEPK.STATUS.DONE
    ], true).build()
  );

  const agenda = ss.getSheetByName(PEPK.SHEETS.AGENDA_INBOX);
  const agendaHeaders = headerMap_(agenda);
  if (agendaHeaders.status) agenda.getRange(2, agendaHeaders.status, Math.max(agenda.getMaxRows() - 1, 1)).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList([
      PEPK.STATUS.WAITING, PEPK.STATUS.APPROVE, PEPK.STATUS.REJECT, PEPK.STATUS.PUBLISHED
    ], true).build()
  );
}
