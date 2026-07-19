/**
 * PEPK Workspace Workflow v0.6.0
 * Spreadsheet-bound Apps Script.
 *
 * Handles:
 * - document upload form submissions -> Upload_Inbox
 * - agenda form submissions -> Agenda_Inbox
 * - admin approvals from Inbox sheets
 */

const PEPK = Object.freeze({
  VERSION: '0.6.0',
  SHEETS: {
    RESOURCES: 'Resources',
    WORKSPACES: 'Workspaces',
    SETTINGS: 'Settings',
    CONFIG: 'Workflow_Config',
    UPLOAD_INBOX: 'Upload_Inbox',
    AGENDA_INBOX: 'Agenda_Inbox',
    AGENDA: 'Agenda'
  },
  CONFIG_KEYS: {
    UPLOAD_FORM_ID: 'upload_form_id',
    UPLOAD_FORM_URL: 'upload_form_url',
    AGENDA_FORM_ID: 'agenda_form_id',
    AGENDA_FORM_URL: 'agenda_form_url',
    INBOX_FOLDER_ID: 'upload_inbox_folder_id',
    REJECTED_FOLDER_ID: 'rejected_folder_id',
    INSTALLED_AT: 'installed_at'
  },
  FORM_TITLES: {
    PIC: 'Nama PIC',
    WORKSPACE: 'Ruang Kerja',
    GROUP: 'Kelompok Dokumen',
    YEAR: 'Tahun',
    SUBFOLDER: 'Subfolder / Jenis Dokumen',
    NOTE: 'Keterangan',
    FILE: 'File Dokumen',
    AGENDA_TITLE: 'Judul Agenda',
    DATE: 'Tanggal',
    START: 'Waktu Mulai',
    END: 'Waktu Selesai',
    CATEGORY: 'Kategori',
    LOCATION: 'Lokasi / Media',
    AGENDA_PIC: 'PIC',
    DESCRIPTION: 'Deskripsi',
    URL: 'Tautan Undangan / Bahan'
  },
  STATUS: {
    WAITING: 'Menunggu',
    APPROVE: 'Disetujui',
    REJECT: 'Ditolak',
    NEEDS_PLACEMENT: 'Perlu penempatan',
    DONE: 'Selesai',
    PUBLISHED: 'Dipublikasikan'
  }
});

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PEPK Workflow')
    .addItem('Jalankan setup', 'setupPepkWorkflow')
    .addItem('Perbarui pilihan formulir', 'refreshFormChoices')
    .addItem('Periksa konfigurasi', 'testWorkflowConfiguration')
    .addSeparator()
    .addItem('Buka formulir unggah', 'openUploadForm')
    .addItem('Buka formulir agenda', 'openAgendaForm')
    .addToUi();
}

/** Receives submissions from both Google Forms. */
function onWorkflowFormSubmit(e) {
  if (!e || !e.source || !e.response) throw new Error('Event pengiriman formulir tidak tersedia.');
  const formId = e.source.getId();
  const config = getWorkflowConfig_();
  if (formId === config[PEPK.CONFIG_KEYS.UPLOAD_FORM_ID]) {
    handleDocumentSubmission_(e.response);
    return;
  }
  if (formId === config[PEPK.CONFIG_KEYS.AGENDA_FORM_ID]) {
    handleAgendaSubmission_(e.response);
  }
}

/** Receives admin status edits from Upload_Inbox and Agenda_Inbox. */
function onWorkflowEdit(e) {
  if (!e || !e.range || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  if (row < 2) return;
  const headers = headerMap_(sheet);
  const statusColumn = headers.status;
  if (!statusColumn || e.range.getColumn() !== statusColumn) return;
  const status = String(e.value || '').trim();

  try {
    if (sheet.getName() === PEPK.SHEETS.UPLOAD_INBOX) processUploadStatus_(sheet, row, status, headers);
    if (sheet.getName() === PEPK.SHEETS.AGENDA_INBOX) processAgendaStatus_(sheet, row, status, headers);
  } catch (error) {
    writeAdminNote_(sheet, row, headers, `Gagal diproses: ${error.message}`);
    throw error;
  }
}

function handleDocumentSubmission_(response) {
  const answers = formAnswers_(response);
  const fileIds = answers.__files || [];
  if (!fileIds.length) throw new Error('Tidak ada file pada pengiriman dokumen.');

  const workspaceId = workspaceIdFromLabel_(answers[PEPK.FORM_TITLES.WORKSPACE]);
  const config = getWorkflowConfig_();
  const inboxFolder = DriveApp.getFolderById(config[PEPK.CONFIG_KEYS.INBOX_FOLDER_ID]);
  const sheet = sheet_(PEPK.SHEETS.UPLOAD_INBOX);
  const submittedAt = response.getTimestamp() || new Date();
  const submitterEmail = response.getRespondentEmail() || '';

  fileIds.forEach((fileId, index) => {
    const file = DriveApp.getFileById(fileId);
    file.moveTo(inboxFolder);
    const submissionId = `UP-${Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')}-${index + 1}`;
    appendByHeaders_(sheet, {
      submission_id: submissionId,
      submitted_at: submittedAt,
      submitter_email: submitterEmail,
      pic: answers[PEPK.FORM_TITLES.PIC] || '',
      workspace_id: workspaceId,
      document_group: answers[PEPK.FORM_TITLES.GROUP] || '',
      year: Number(answers[PEPK.FORM_TITLES.YEAR] || 0),
      subfolder: answers[PEPK.FORM_TITLES.SUBFOLDER] || '',
      description: answers[PEPK.FORM_TITLES.NOTE] || '',
      file_name: file.getName(),
      file_id: file.getId(),
      file_url: file.getUrl(),
      status: PEPK.STATUS.WAITING,
      destination_url: '',
      admin_note: '',
      processed_at: ''
    });
  });
}

function handleAgendaSubmission_(response) {
  const answers = formAnswers_(response);
  const submittedAt = response.getTimestamp() || new Date();
  const sheet = sheet_(PEPK.SHEETS.AGENDA_INBOX);
  const submissionId = `AG-${Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')}`;

  appendByHeaders_(sheet, {
    submission_id: submissionId,
    submitted_at: submittedAt,
    submitter_email: response.getRespondentEmail() || '',
    title: answers[PEPK.FORM_TITLES.AGENDA_TITLE] || '',
    date: formatFormDate_(answers[PEPK.FORM_TITLES.DATE]),
    start_time: formatFormTime_(answers[PEPK.FORM_TITLES.START]),
    end_time: formatFormTime_(answers[PEPK.FORM_TITLES.END]),
    category: answers[PEPK.FORM_TITLES.CATEGORY] || 'Internal',
    location: answers[PEPK.FORM_TITLES.LOCATION] || '',
    pic: answers[PEPK.FORM_TITLES.AGENDA_PIC] || '',
    description: answers[PEPK.FORM_TITLES.DESCRIPTION] || '',
    url: answers[PEPK.FORM_TITLES.URL] || '',
    status: PEPK.STATUS.WAITING,
    published_id: '',
    admin_note: '',
    processed_at: ''
  });
}

function processUploadStatus_(sheet, row, status, headers) {
  if (![PEPK.STATUS.APPROVE, PEPK.STATUS.REJECT].includes(status)) return;
  const record = rowObject_(sheet, row, headers);
  if (record.processed_at) return;
  const config = getWorkflowConfig_();
  const file = DriveApp.getFileById(String(record.file_id));

  if (status === PEPK.STATUS.REJECT) {
    const rejectedFolder = DriveApp.getFolderById(config[PEPK.CONFIG_KEYS.REJECTED_FOLDER_ID]);
    file.moveTo(rejectedFolder);
    updateRow_(sheet, row, headers, {
      status: PEPK.STATUS.REJECT,
      destination_url: rejectedFolder.getUrl(),
      processed_at: new Date()
    });
    return;
  }

  const destination = resolveDestination_(record);
  if (!destination.folder) {
    updateRow_(sheet, row, headers, {
      status: PEPK.STATUS.NEEDS_PLACEMENT,
      admin_note: destination.message || 'Folder tujuan tidak ditemukan.'
    });
    return;
  }

  file.moveTo(destination.folder);
  updateRow_(sheet, row, headers, {
    status: PEPK.STATUS.DONE,
    destination_url: destination.folder.getUrl(),
    admin_note: destination.message || '',
    processed_at: new Date()
  });
}

function processAgendaStatus_(sheet, row, status, headers) {
  if (![PEPK.STATUS.APPROVE, PEPK.STATUS.REJECT].includes(status)) return;
  const record = rowObject_(sheet, row, headers);
  if (record.processed_at) return;

  if (status === PEPK.STATUS.REJECT) {
    updateRow_(sheet, row, headers, { status: PEPK.STATUS.REJECT, processed_at: new Date() });
    return;
  }

  const agendaSheet = sheet_(PEPK.SHEETS.AGENDA);
  const publishedId = agendaId_(record.title, record.date);
  appendByHeaders_(agendaSheet, {
    id: publishedId,
    title: record.title,
    date: record.date,
    start_time: record.start_time,
    end_time: record.end_time,
    category: record.category,
    location: record.location,
    pic: record.pic,
    description: record.description,
    url: record.url,
    sort_order: agendaSheet.getLastRow(),
    is_active: true
  });
  updateRow_(sheet, row, headers, {
    status: PEPK.STATUS.PUBLISHED,
    published_id: publishedId,
    processed_at: new Date()
  });
}

function resolveDestination_(record) {
  const resources = sheet_(PEPK.SHEETS.RESOURCES).getDataRange().getDisplayValues();
  if (resources.length < 2) return { folder: null, message: 'Sheet Resources kosong.' };
  const headers = resources[0].map(normalizeKey_);
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  const expectedTitle = normalizeText_(`${record.document_group} ${record.year}`);
  const row = resources.slice(1).find((values) =>
    normalizeText_(values[index.workspace_id]) === normalizeText_(record.workspace_id) &&
    normalizeText_(values[index.title]) === expectedTitle &&
    truthy_(values[index.is_active])
  );
  if (!row) return { folder: null, message: `Folder ${record.document_group} ${record.year} tidak ditemukan pada Resources.` };
  const yearFolderId = extractDriveId_(row[index.url]);
  if (!yearFolderId) return { folder: null, message: 'ID folder tahun tidak valid.' };
  const yearFolder = DriveApp.getFolderById(yearFolderId);
  const subfolderName = String(record.subfolder || '').trim();
  if (!subfolderName) return { folder: yearFolder, message: 'Dipindahkan ke folder tahun.' };

  const target = findDirectSubfolder_(yearFolder, subfolderName);
  if (target) return { folder: target, message: `Dipindahkan ke subfolder ${target.getName()}.` };
  return { folder: null, message: `Subfolder “${subfolderName}” tidak ditemukan di ${record.document_group} ${record.year}.` };
}

function findDirectSubfolder_(parent, expectedName) {
  const expected = normalizeText_(expectedName);
  const folders = parent.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    if (normalizeText_(folder.getName()) === expected) return folder;
  }
  return null;
}

function formAnswers_(response) {
  const answers = { __files: [] };
  response.getItemResponses().forEach((itemResponse) => {
    const item = itemResponse.getItem();
    const title = item.getTitle();
    const value = itemResponse.getResponse();
    if (item.getType().toString() === 'FILE_UPLOAD') answers.__files = answers.__files.concat(value || []);
    else answers[title] = Array.isArray(value) ? value.join(', ') : value;
  });
  return answers;
}

function workspaceIdFromLabel_(label) {
  const value = normalizeText_(label);
  const rows = sheet_(PEPK.SHEETS.WORKSPACES).getDataRange().getDisplayValues();
  if (rows.length < 2) return value;
  const headers = rows[0].map(normalizeKey_);
  const idIndex = headers.indexOf('id');
  const titleIndex = headers.indexOf('title');
  const match = rows.slice(1).find((row) => normalizeText_(row[idIndex]) === value || normalizeText_(row[titleIndex]) === value);
  return match ? match[idIndex] : value;
}

function agendaId_(title, date) {
  const slug = String(title || 'agenda').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return `${date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}-${slug}`;
}

function formatFormDate_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const text = String(value || '').trim();
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? text : Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatFormTime_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  const text = String(value || '').trim().replace('.', ':');
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${String(Number(match[1])).padStart(2, '0')}:${match[2]}` : text;
}

function truthy_(value) {
  return !['', 'false', '0', 'tidak', 'no'].includes(String(value || '').trim().toLowerCase());
}

function normalizeText_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeKey_(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function extractDriveId_(url) {
  const match = String(url || '').match(/[-\w]{20,}/);
  return match ? match[0] : '';
}

function sheet_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error(`Sheet ${name} tidak ditemukan.`);
  return sheet;
}

function headerMap_(sheet) {
  const values = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return Object.fromEntries(values.map((header, index) => [normalizeKey_(header), index + 1]));
}

function rowObject_(sheet, row, headers) {
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  return Object.fromEntries(Object.entries(headers).map(([key, col]) => [key, values[col - 1]]));
}

function appendByHeaders_(sheet, record) {
  const headers = headerMap_(sheet);
  const row = Array(sheet.getLastColumn()).fill('');
  Object.entries(record).forEach(([key, value]) => {
    if (headers[key]) row[headers[key] - 1] = value;
  });
  sheet.appendRow(row);
}

function updateRow_(sheet, row, headers, values) {
  Object.entries(values).forEach(([key, value]) => {
    if (headers[key]) sheet.getRange(row, headers[key]).setValue(value);
  });
}

function writeAdminNote_(sheet, row, headers, message) {
  if (headers.admin_note) sheet.getRange(row, headers.admin_note).setValue(message);
}

function getWorkflowConfig_() {
  const sheet = sheet_(PEPK.SHEETS.CONFIG);
  const values = sheet.getDataRange().getDisplayValues();
  return Object.fromEntries(values.slice(1).filter((row) => row[0]).map((row) => [String(row[0]).trim(), String(row[1]).trim()]));
}

function setWorkflowConfig_(key, value) {
  const sheet = sheet_(PEPK.SHEETS.CONFIG);
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 2).getDisplayValues();
  const rowIndex = values.findIndex((row, index) => index > 0 && row[0] === key);
  if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 2).setValue(value);
  else sheet.appendRow([key, value, 'Dibuat oleh Apps Script']);
}

function upsertSetting_(key, value) {
  const sheet = sheet_(PEPK.SHEETS.SETTINGS);
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 2).getDisplayValues();
  const rowIndex = values.findIndex((row, index) => index > 0 && row[0] === key);
  if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 2).setValue(value);
  else sheet.appendRow([key, value]);
}
