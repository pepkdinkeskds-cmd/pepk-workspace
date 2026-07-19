/**
 * PEPK Workflow v0.6.1 Final — complete copy/paste file.
 * Paste the entire contents into Code.gs in the spreadsheet-bound Apps Script project.
 */

/**
 * PEPK Workspace Workflow v0.6.1
 * Spreadsheet-bound Apps Script.
 *
 * Handles:
 * - document upload form submissions -> Upload_Inbox
 * - agenda form submissions -> Agenda_Inbox
 * - admin approvals from Inbox sheets
 */

const PEPK = Object.freeze({
  VERSION: '0.6.1',
  SHEETS: {
    RESOURCES: 'Resources',
    WORKSPACES: 'Workspaces',
    SETTINGS: 'Settings',
    CONFIG: 'Workflow_Config',
    UPLOAD_INBOX: 'Upload_Inbox',
    AGENDA_INBOX: 'Agenda_Inbox',
    AGENDA: 'Agenda',
    UPLOAD_ROUTES: 'Upload_Routes'
  },
  CONFIG_KEYS: {
    UPLOAD_FORM_ID: 'upload_form_id',
    UPLOAD_FORM_URL: 'upload_form_url',
    AGENDA_FORM_ID: 'agenda_form_id',
    AGENDA_FORM_URL: 'agenda_form_url',
    INBOX_FOLDER_ID: 'upload_inbox_folder_id',
    REJECTED_FOLDER_ID: 'rejected_folder_id',
    INSTALLED_AT: 'installed_at',
    ROUTES_SYNCED_AT: 'routes_synced_at'
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
    URL: 'Tautan Undangan / Bahan',
    ROUTE_PREFIX: 'Tujuan Folder — '
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
    .addItem('Sinkronkan struktur folder', 'syncUploadRoutes')
    .addItem('Perbarui pilihan formulir', 'refreshFormChoices')
    .addItem('Periksa konfigurasi', 'testWorkflowConfiguration')
    .addItem('Perbaiki ID agenda lama', 'repairAgendaIds')
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

  const workspaceLabel = answers[PEPK.FORM_TITLES.WORKSPACE] || '';
  const workspaceId = workspaceIdFromLabel_(workspaceLabel);
  const routeAnswer = findRouteAnswer_(answers);
  if (!routeAnswer) throw new Error('Tujuan folder belum dipilih. Sinkronkan struktur folder lalu coba kembali.');

  const route = findUploadRoute_(workspaceId, routeAnswer.label);
  if (!route) throw new Error(`Rute folder “${routeAnswer.label}” tidak ditemukan atau sudah tidak aktif.`);

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
      route_id: route.route_id,
      folder_id: route.folder_id,
      destination_label: route.label,
      workspace_id: route.workspace_id,
      document_group: route.document_group,
      year: Number(route.year || 0),
      subfolder: route.subfolder || '',
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
  const agendaDate = formatFormDate_(record.date);
  const startTime = formatFormTime_(record.start_time);
  const endTime = formatFormTime_(record.end_time);
  const publishedId = agendaId_(record.title, agendaDate);
  appendByHeaders_(agendaSheet, {
    id: publishedId,
    title: record.title,
    date: agendaDate,
    start_time: startTime,
    end_time: endTime,
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
  const folderId = String(record.folder_id || '').trim();
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      return { folder, message: `Dipindahkan ke ${record.destination_label || folder.getName()}.` };
    } catch (error) {
      return { folder: null, message: `Folder tujuan tidak dapat diakses: ${error.message}` };
    }
  }

  const routeId = String(record.route_id || '').trim();
  if (routeId) {
    const route = findUploadRouteById_(routeId);
    if (route && route.folder_id) {
      try {
        return {
          folder: DriveApp.getFolderById(route.folder_id),
          message: `Dipindahkan ke ${route.label}.`
        };
      } catch (error) {
        return { folder: null, message: `Folder rute tidak dapat diakses: ${error.message}` };
      }
    }
  }

  // Fallback untuk baris lama v0.6.0 yang masih memakai isian subfolder bebas.
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
  const cleanDate = formatFormDate_(date) || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return `agenda-${cleanDate}-${slug}`;
}

/** Repairs agenda IDs and normalizes agenda dates/times created by earlier workflow builds. */
function repairAgendaIds() {
  const agendaSheet = sheet_(PEPK.SHEETS.AGENDA);
  const agendaHeaders = headerMap_(agendaSheet);
  let agendaUpdated = 0;

  for (let row = 2; row <= agendaSheet.getLastRow(); row += 1) {
    const record = rowObject_(agendaSheet, row, agendaHeaders);
    if (!record.title || !record.date) continue;
    const cleanDate = formatFormDate_(record.date);
    const cleanStart = formatFormTime_(record.start_time);
    const cleanEnd = formatFormTime_(record.end_time);
    const cleanId = agendaId_(record.title, cleanDate);
    updateRow_(agendaSheet, row, agendaHeaders, {
      id: cleanId,
      date: cleanDate,
      start_time: cleanStart,
      end_time: cleanEnd
    });
    agendaUpdated += 1;
  }

  const inboxSheet = sheet_(PEPK.SHEETS.AGENDA_INBOX);
  const inboxHeaders = headerMap_(inboxSheet);
  let inboxUpdated = 0;
  for (let row = 2; row <= inboxSheet.getLastRow(); row += 1) {
    const record = rowObject_(inboxSheet, row, inboxHeaders);
    const isPublished = String(record.status || '').trim() === PEPK.STATUS.PUBLISHED;
    if (!isPublished || !record.title || !record.date) continue;
    const cleanDate = formatFormDate_(record.date);
    const cleanId = agendaId_(record.title, cleanDate);
    updateRow_(inboxSheet, row, inboxHeaders, {
      published_id: cleanId
    });
    inboxUpdated += 1;
  }

  SpreadsheetApp.getUi().alert(
    'Perbaikan agenda selesai',
    `${agendaUpdated} baris Agenda dan ${inboxUpdated} baris Agenda_Inbox telah dinormalisasi.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
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


/** Setup and maintenance functions for PEPK Workflow v0.6.1. */

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
  const syncResult = rebuildUploadRoutes_();
  if (!syncResult.routes.length) {
    throw new Error('Tidak ada rute folder yang berhasil dibaca. Periksa URL folder tahun pada sheet Resources dan izin Google Drive.');
  }
  prepareUploadForm_(uploadForm, syncResult.routes);

  const agendaForm = getOrCreateAgendaForm_(spreadsheet);
  const folders = ensureWorkflowFolders_(spreadsheet);

  setWorkflowConfig_(PEPK.CONFIG_KEYS.UPLOAD_FORM_URL, uploadForm.getPublishedUrl());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.AGENDA_FORM_ID, agendaForm.getId());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.AGENDA_FORM_URL, agendaForm.getPublishedUrl());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.INBOX_FOLDER_ID, folders.inbox.getId());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.REJECTED_FOLDER_ID, folders.rejected.getId());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.ROUTES_SYNCED_AT, new Date());
  setWorkflowConfig_(PEPK.CONFIG_KEYS.INSTALLED_AT, new Date());

  upsertSetting_('app_version', PEPK.VERSION);
  upsertSetting_('workflow_enabled', 'TRUE');
  upsertSetting_('document_upload_form_url', uploadForm.getPublishedUrl());
  upsertSetting_('agenda_submit_form_url', agendaForm.getPublishedUrl());

  installTriggers_(uploadForm, agendaForm, spreadsheet);
  formatWorkflowSheets_();

  const warning = syncResult.errors.length
    ? `\n\nCatatan: ${syncResult.errors.length} folder gagal dibaca. Lihat log eksekusi.`
    : '';
  ui.alert(
    'PEPK Workflow v0.6.1 siap',
    `Form unggah:\n${uploadForm.getPublishedUrl()}\n\nForm agenda:\n${agendaForm.getPublishedUrl()}\n\n${syncResult.routes.length} tujuan folder telah disinkronkan.${warning}`,
    ui.ButtonSet.OK
  );
}

function ensureWorkflowSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const definitions = {
    [PEPK.SHEETS.CONFIG]: ['key', 'value', 'description'],
    [PEPK.SHEETS.UPLOAD_ROUTES]: [
      'route_id', 'workspace_id', 'workspace_title', 'document_group', 'year', 'subfolder',
      'folder_id', 'folder_url', 'label', 'depth', 'source_resource_id', 'is_active', 'last_synced_at'
    ],
    [PEPK.SHEETS.UPLOAD_INBOX]: [
      'submission_id', 'submitted_at', 'submitter_email', 'pic', 'route_id', 'folder_id', 'destination_label',
      'workspace_id', 'document_group', 'year', 'subfolder', 'description', 'file_name', 'file_id', 'file_url',
      'status', 'destination_url', 'admin_note', 'processed_at'
    ],
    [PEPK.SHEETS.AGENDA_INBOX]: [
      'submission_id', 'submitted_at', 'submitter_email', 'title', 'date', 'start_time', 'end_time', 'category', 'location',
      'pic', 'description', 'url', 'status', 'published_id', 'admin_note', 'processed_at'
    ]
  };

  Object.entries(definitions).forEach(([name, headers]) => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    ensureSheetHeaders_(sheet, headers);
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
    [PEPK.CONFIG_KEYS.ROUTES_SYNCED_AT, '', 'Waktu sinkronisasi struktur folder terakhir.'],
    [PEPK.CONFIG_KEYS.INSTALLED_AT, '', 'Waktu setup terakhir.']
  ];
  defaults.filter(([key]) => !(key in existing)).forEach((row) => configSheet.appendRow(row));
}

function publishFormForResponses_(form) {
  // Google Forms versi baru harus dipublikasikan sebelum menerima respons.
  // Form lama yang belum memakai advanced responder permissions tetap memakai
  // setAcceptingResponses sebagai fallback.
  try {
    if (form.supportsAdvancedResponderPermissions()) {
      form.setPublished(true);
      return;
    }
  } catch (error) {
    console.warn('Pemeriksaan status publikasi Form dilewati: ' + error.message);
  }

  form.setAcceptingResponses(true);
}


function clearUploadFormItems_(form, uploadItem) {
  const preservedId = uploadItem.getId();
  const items = form.getItems().filter((item) => item.getId() !== preservedId);

  // Lepaskan seluruh relasi navigasi terlebih dahulu.
  // Google Forms menolak penghapusan PageBreak yang masih menjadi tujuan pilihan.
  items.forEach((item) => {
    try {
      const type = item.getType();

      if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
        const multipleChoice = item.asMultipleChoiceItem();
        const labels = multipleChoice.getChoices()
          .map((choice) => String(choice.getValue() || '').trim())
          .filter(Boolean);
        const safeLabels = labels.length ? labels : ['Memperbarui formulir'];
        multipleChoice.setChoices(
          safeLabels.map((label) =>
            multipleChoice.createChoice(label, FormApp.PageNavigationType.CONTINUE)
          )
        );
        return;
      }

      if (type === FormApp.ItemType.LIST) {
        const listItem = item.asListItem();
        const labels = listItem.getChoices()
          .map((choice) => String(choice.getValue() || '').trim())
          .filter(Boolean);
        const safeLabels = labels.length ? labels : ['Memperbarui formulir'];
        listItem.setChoices(
          safeLabels.map((label) =>
            listItem.createChoice(label, FormApp.PageNavigationType.CONTINUE)
          )
        );
        return;
      }

      if (type === FormApp.ItemType.PAGE_BREAK) {
        item.asPageBreakItem().setGoToPage(FormApp.PageNavigationType.CONTINUE);
      }
    } catch (error) {
      console.warn(
        `Navigasi item ${item.getId()} tidak dapat dinetralkan: ${error.message}`
      );
    }
  });

  // Hapus pertanyaan navigasi dahulu, kemudian PageBreak, lalu item lainnya.
  const priority = (item) => {
    const type = item.getType();
    if (type === FormApp.ItemType.MULTIPLE_CHOICE || type === FormApp.ItemType.LIST) return 1;
    if (type === FormApp.ItemType.PAGE_BREAK) return 2;
    return 3;
  };

  items
    .map((item) => ({
      item,
      index: item.getIndex(),
      priority: priority(item)
    }))
    .sort((left, right) =>
      left.priority - right.priority || right.index - left.index
    )
    .forEach(({ item }) => form.deleteItem(item));
}

function prepareUploadForm_(form, routes) {
  form.setTitle('PEPK — Unggah Dokumen');
  form.setDescription('Kirim dokumen kerja PEPK tanpa akses Editor. Pilih tujuan folder yang sudah disinkronkan langsung dari Google Drive.');
  form.setCollectEmail(true);
  form.setConfirmationMessage('Dokumen telah dikirim ke antrean pemeriksaan PEPK.');
  form.setProgressBar(true);
  publishFormForResponses_(form);

  const uploadItem = form.getItems().find((item) => item.getType().toString() === 'FILE_UPLOAD');
  if (!uploadItem) throw new Error('Form unggah harus memiliki pertanyaan File upload berjudul “File Dokumen”.');

  // Bersihkan pertanyaan workflow lama dengan aman.
  // Item navigasi harus dilepas terlebih dahulu sebelum PageBreak dihapus.
  clearUploadFormItems_(form, uploadItem);
  uploadItem.setTitle(PEPK.FORM_TITLES.FILE);

  ensureTextItem_(form, PEPK.FORM_TITLES.PIC, true, 'Nama staf/PIC yang bertanggung jawab atas dokumen.');
  ensureParagraphItem_(form, PEPK.FORM_TITLES.NOTE, false, 'Keterangan singkat isi atau tujuan dokumen.');
  const workspaceItem = form.addMultipleChoiceItem()
    .setTitle(PEPK.FORM_TITLES.WORKSPACE)
    .setHelpText('Pilih ruang kerja untuk menampilkan daftar folder tujuan yang sesuai.')
    .setRequired(true);

  // Urutan halaman pertama: Nama PIC, Keterangan, File, Ruang Kerja.
  form.moveItem(uploadItem, 2);

  const routeGroups = routes.reduce((groups, route) => {
    if (!groups[route.workspace_id]) groups[route.workspace_id] = [];
    groups[route.workspace_id].push(route);
    return groups;
  }, {});

  const workspaces = workspaceDefinitions_().filter((workspace) => (routeGroups[workspace.id] || []).length);
  if (!workspaces.length) throw new Error('Tidak ada ruang kerja yang memiliki rute upload aktif.');

  const sections = [];
  workspaces.forEach((workspace) => {
    const workspaceRoutes = (routeGroups[workspace.id] || []).slice().sort(routeSort_);
    const page = form.addPageBreakItem()
      .setTitle(`Tujuan Folder — ${workspace.title}`)
      .setHelpText('Daftar ini mengikuti struktur Google Drive. Pilih folder tahun atau subfolder yang sesuai.');
    const routeItem = form.addListItem()
      .setTitle(`${PEPK.FORM_TITLES.ROUTE_PREFIX}${workspace.title}`)
      .setChoiceValues(workspaceRoutes.map((route) => route.label))
      .setRequired(true);
    sections.push({ workspace, page, routeItem });
  });

  // PageBreak berikutnya menentukan aksi setelah halaman sebelumnya selesai.
  // Karena itu setiap section setelah section pertama dibuat SUBMIT untuk menutup section sebelumnya.
  for (let index = 1; index < sections.length; index += 1) {
    sections[index].page.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  }
  const finishPage = form.addPageBreakItem().setTitle('Selesai');
  finishPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  workspaceItem.setChoices(
    sections.map(({ workspace, page }) => workspaceItem.createChoice(workspace.title, page))
  );
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
  publishFormForResponses_(form);

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
  const managed = ['onWorkflowFormSubmit', 'onWorkflowEdit', 'syncUploadRoutesSilently'];
  ScriptApp.getProjectTriggers().forEach((trigger) => {
    if (managed.includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onWorkflowFormSubmit').forForm(uploadForm).onFormSubmit().create();
  ScriptApp.newTrigger('onWorkflowFormSubmit').forForm(agendaForm).onFormSubmit().create();
  ScriptApp.newTrigger('onWorkflowEdit').forSpreadsheet(spreadsheet).onEdit().create();
  ScriptApp.newTrigger('syncUploadRoutesSilently').timeBased().everyDays(1).atHour(3).create();
}

function refreshFormChoices() {
  syncUploadRoutes();
}

function testWorkflowConfiguration() {
  ensureWorkflowSheets_();
  const config = getWorkflowConfig_();
  const required = [
    PEPK.CONFIG_KEYS.UPLOAD_FORM_ID,
    PEPK.CONFIG_KEYS.AGENDA_FORM_ID,
    PEPK.CONFIG_KEYS.INBOX_FOLDER_ID
  ];
  const missing = required.filter((key) => !config[key]);
  const routeSheet = sheet_(PEPK.SHEETS.UPLOAD_ROUTES);
  const routeCount = Math.max(routeSheet.getLastRow() - 1, 0);
  const message = missing.length
    ? `Belum lengkap: ${missing.join(', ')}`
    : `Konfigurasi utama lengkap. ${routeCount} rute folder aktif tersedia. Sinkronisasi terakhir: ${config[PEPK.CONFIG_KEYS.ROUTES_SYNCED_AT] || 'belum tercatat'}.`;
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


/** Synchronizes upload routes from the active Drive folder structure. */
function syncUploadRoutes() {
  const result = syncUploadRoutes_(true);
  return result;
}

function syncUploadRoutesSilently() {
  syncUploadRoutes_(false);
}

function syncUploadRoutes_(showAlert) {
  ensureWorkflowSheets_();
  const result = rebuildUploadRoutes_();
  const config = getWorkflowConfig_();
  const formId = String(config[PEPK.CONFIG_KEYS.UPLOAD_FORM_ID] || '').trim();
  if (formId) prepareUploadForm_(FormApp.openById(formId), result.routes);
  setWorkflowConfig_(PEPK.CONFIG_KEYS.ROUTES_SYNCED_AT, new Date());
  formatWorkflowSheets_();

  if (showAlert) {
    const errorText = result.errors.length
      ? `\n\n${result.errors.length} folder gagal dibaca. Detail tersedia di log eksekusi.`
      : '';
    SpreadsheetApp.getUi().alert(
      'Sinkronisasi selesai',
      `${result.routes.length} tujuan folder telah dimasukkan ke Upload_Routes dan Google Form.${errorText}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
  return result;
}

function rebuildUploadRoutes_() {
  const routesSheet = sheet_(PEPK.SHEETS.UPLOAD_ROUTES);
  const resources = sheet_(PEPK.SHEETS.RESOURCES).getDataRange().getDisplayValues();
  const workspaces = workspaceDefinitions_();
  const workspaceMap = Object.fromEntries(workspaces.map((workspace) => [workspace.id, workspace]));
  const routes = [];
  const errors = [];
  const seenFolders = new Set();
  const syncedAt = new Date();

  if (resources.length < 2) return { routes, errors: ['Sheet Resources kosong.'] };
  const headers = resources[0].map(normalizeKey_);
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));

  resources.slice(1).forEach((row) => {
    const type = normalizeText_(row[index.type]);
    if (!row[index.id] || type === 'application' || !truthy_(row[index.is_active])) return;
    const title = String(row[index.title] || '').trim();
    const titleMatch = title.match(/^(.*)\s+(20\d{2})$/);
    if (!titleMatch) return;
    const workspaceId = String(row[index.workspace_id] || '').trim();
    const workspace = workspaceMap[workspaceId] || { id: workspaceId, title: workspaceId, sort_order: 999 };
    const documentGroup = titleMatch[1].trim();
    const year = Number(titleMatch[2]);
    const folderId = extractDriveId_(row[index.url]);
    if (!folderId) return;

    try {
      const yearFolder = DriveApp.getFolderById(folderId);
      addRoute_(routes, seenFolders, {
        workspace,
        documentGroup,
        year,
        subfolderPath: [],
        folder: yearFolder,
        sourceResourceId: row[index.id],
        syncedAt
      });
      collectSubfolderRoutes_(routes, seenFolders, {
        workspace,
        documentGroup,
        year,
        parent: yearFolder,
        path: [],
        depth: 1,
        maxDepth: 3,
        sourceResourceId: row[index.id],
        syncedAt
      });
    } catch (error) {
      const message = `${title}: ${error.message}`;
      errors.push(message);
      console.warn(message);
    }
  });

  routes.sort(routeSort_);
  writeUploadRoutes_(routesSheet, routes);
  return { routes, errors };
}

function collectSubfolderRoutes_(routes, seenFolders, context) {
  if (context.depth > context.maxDepth) return;
  const folders = context.parent.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    const nextPath = context.path.concat(folder.getName());
    addRoute_(routes, seenFolders, {
      workspace: context.workspace,
      documentGroup: context.documentGroup,
      year: context.year,
      subfolderPath: nextPath,
      folder,
      sourceResourceId: context.sourceResourceId,
      syncedAt: context.syncedAt
    });
    collectSubfolderRoutes_(routes, seenFolders, {
      ...context,
      parent: folder,
      path: nextPath,
      depth: context.depth + 1
    });
  }
}

function addRoute_(routes, seenFolders, context) {
  const folderId = context.folder.getId();
  if (seenFolders.has(folderId)) return;
  seenFolders.add(folderId);
  const subfolder = context.subfolderPath.join(' › ');
  const baseLabel = `${context.documentGroup} ${context.year}`;
  routes.push({
    route_id: `RT-${folderId}`,
    workspace_id: context.workspace.id,
    workspace_title: context.workspace.title,
    workspace_sort: Number(context.workspace.sort_order || 999),
    document_group: context.documentGroup,
    year: context.year,
    subfolder,
    folder_id: folderId,
    folder_url: context.folder.getUrl(),
    label: subfolder ? `${baseLabel} › ${subfolder}` : `${baseLabel} — Folder Tahun`,
    depth: context.subfolderPath.length,
    source_resource_id: context.sourceResourceId,
    is_active: true,
    last_synced_at: context.syncedAt
  });
}

function writeUploadRoutes_(sheet, routes) {
  const headers = headerMap_(sheet);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  if (!routes.length) return;
  const orderedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(normalizeKey_);
  const values = routes.map((route) => orderedHeaders.map((header) => route[header] ?? ''));
  sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
}

function routeSort_(left, right) {
  return Number(left.workspace_sort || 999) - Number(right.workspace_sort || 999)
    || String(left.document_group).localeCompare(String(right.document_group), 'id')
    || Number(right.year || 0) - Number(left.year || 0)
    || Number(left.depth || 0) - Number(right.depth || 0)
    || String(left.subfolder || '').localeCompare(String(right.subfolder || ''), 'id');
}

function workspaceDefinitions_() {
  const rows = sheet_(PEPK.SHEETS.WORKSPACES).getDataRange().getDisplayValues();
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeKey_);
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  return rows.slice(1)
    .filter((row) => row[index.id] && truthy_(row[index.is_active]))
    .map((row) => ({
      id: String(row[index.id]).trim(),
      title: String(row[index.title] || row[index.id]).trim(),
      sort_order: Number(row[index.sort_order] || 999)
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, 'id'));
}

function findRouteAnswer_(answers) {
  const entry = Object.entries(answers).find(([title, value]) =>
    title.startsWith(PEPK.FORM_TITLES.ROUTE_PREFIX) && String(value || '').trim()
  );
  return entry ? { title: entry[0], label: String(entry[1]).trim() } : null;
}

function findUploadRoute_(workspaceId, label) {
  const rows = sheet_(PEPK.SHEETS.UPLOAD_ROUTES).getDataRange().getDisplayValues();
  if (rows.length < 2) return null;
  const headers = rows[0].map(normalizeKey_);
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  const match = rows.slice(1).find((row) =>
    normalizeText_(row[index.workspace_id]) === normalizeText_(workspaceId) &&
    normalizeText_(row[index.label]) === normalizeText_(label) &&
    truthy_(row[index.is_active])
  );
  return match ? routeObjectFromRow_(headers, match) : null;
}

function findUploadRouteById_(routeId) {
  const rows = sheet_(PEPK.SHEETS.UPLOAD_ROUTES).getDataRange().getDisplayValues();
  if (rows.length < 2) return null;
  const headers = rows[0].map(normalizeKey_);
  const routeIndex = headers.indexOf('route_id');
  const match = rows.slice(1).find((row) => String(row[routeIndex]).trim() === String(routeId).trim());
  return match ? routeObjectFromRow_(headers, match) : null;
}

function routeObjectFromRow_(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
}

function ensureSheetHeaders_(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(normalizeKey_);
  const missing = requiredHeaders.filter((header) => !existing.includes(normalizeKey_(header)));
  if (missing.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
  }
}

function ensureTextItem_(form, title, required, helpText) {
  const item = findItemByTitle_(form, title);
  let textItem;

  if (!item) {
    textItem = form.addTextItem().setTitle(title);
  } else if (item.getType() === FormApp.ItemType.TEXT) {
    textItem = item.asTextItem();
  } else {
    form.deleteItem(item);
    textItem = form.addTextItem().setTitle(title);
  }

  textItem.setRequired(Boolean(required));
  textItem.setHelpText(helpText || '');
  return textItem;
}

function ensureParagraphItem_(form, title, required, helpText) {
  const item = findItemByTitle_(form, title);
  let paragraphItem;

  if (!item) {
    paragraphItem = form.addParagraphTextItem().setTitle(title);
  } else if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) {
    paragraphItem = item.asParagraphTextItem();
  } else {
    form.deleteItem(item);
    paragraphItem = form.addParagraphTextItem().setTitle(title);
  }

  paragraphItem.setRequired(Boolean(required));
  paragraphItem.setHelpText(helpText || '');
  return paragraphItem;
}

function ensureListItem_(form, title, values, required) {
  const item = findItemByTitle_(form, title);
  let listItem;

  if (!item) {
    listItem = form.addListItem().setTitle(title);
  } else if (item.getType() === FormApp.ItemType.LIST) {
    listItem = item.asListItem();
  } else {
    form.deleteItem(item);
    listItem = form.addListItem().setTitle(title);
  }

  listItem.setChoiceValues(values.length ? values : ['Belum tersedia']);
  listItem.setRequired(Boolean(required));
  return listItem;
}

function ensureDateItem_(form, title, required) {
  const item = findItemByTitle_(form, title);
  let dateItem;

  if (!item) {
    dateItem = form.addDateItem().setTitle(title);
  } else if (item.getType() === FormApp.ItemType.DATE) {
    dateItem = item.asDateItem();
  } else {
    form.deleteItem(item);
    dateItem = form.addDateItem().setTitle(title);
  }

  return dateItem.setRequired(Boolean(required));
}

function ensureTimeItem_(form, title, required) {
  const item = findItemByTitle_(form, title);
  let timeItem;

  if (!item) {
    timeItem = form.addTimeItem().setTitle(title);
  } else if (item.getType() === FormApp.ItemType.TIME) {
    timeItem = item.asTimeItem();
  } else {
    form.deleteItem(item);
    timeItem = form.addTimeItem().setTitle(title);
  }

  return timeItem.setRequired(Boolean(required));
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
  [PEPK.SHEETS.CONFIG, PEPK.SHEETS.UPLOAD_ROUTES, PEPK.SHEETS.UPLOAD_INBOX, PEPK.SHEETS.AGENDA_INBOX].forEach((name) => {
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
