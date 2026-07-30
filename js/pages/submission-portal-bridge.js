/**
 * PEPK Workspace v0.9.5 — MOBILE ACCESS HOTFIX 01
 *
 * Mengalihkan tombol layanan Dokumen, Agenda, Materi Monev, dan Referensi dari
 * Google Forms lama ke deployment aktif PEPK Submission Portal.
 * Portal saat ini membuka pemilih modul pada halaman utama, sehingga
 * keempat layanan menggunakan URL deployment yang sama.
 */

export const SUBMISSION_PORTAL_URL =
  'https://script.google.com/macros/s/AKfycbyjW1UYM2-k0AcXMrYmV36qDIL6PtJrOmOxUs4P1bhMkbpiyIEqR5_VgmMX3cdT2sM/exec';

const MODULE_LABELS = Object.freeze({
  document: 'Buka pengajuan Dokumen',
  agenda: 'Buka pengajuan Agenda',
  monev: 'Buka pengajuan Materi Monev',
  reference: 'Buka pengajuan Referensi'
});

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function moduleFromContext(anchor) {
  const anchorText = normalizeText(anchor.textContent);
  const card = anchor.closest('article, li, section, .card, .contribution-card, div');
  const contextText = normalizeText(card?.textContent || anchorText);
  const combined = `${anchorText} ${contextText}`;

  if (/materi\s*monev|monev/.test(combined)) return 'monev';
  if (/referensi|reference|\brba\b|\brsb\b|peraturan/.test(combined)) return 'reference';
  if (/tambah\s*agenda|formulir\s*agenda|pengajuan\s*agenda|\bagenda\b/.test(combined)) return 'agenda';
  if (/unggah\s*dokumen|formulir\s*unggah|pengajuan\s*dokumen|\bdokumen\b/.test(combined)) return 'document';
  return '';
}

function isLegacySubmissionLink(anchor) {
  const href = String(anchor.getAttribute('href') || '').trim().toLowerCase();
  const label = normalizeText(anchor.textContent);

  return (
    href.includes('docs.google.com/forms') ||
    href.includes('forms.gle') ||
    label.includes('buka formulir')
  );
}

function setAccessibleLabel(anchor, label) {
  const reusableIcons = Array.from(anchor.children).filter((element) =>
    element.matches('[data-icon], svg, img, .icon, .button__icon')
  );

  if (reusableIcons.length) {
    const icons = reusableIcons.map((element) => element.cloneNode(true));
    anchor.replaceChildren(...icons, document.createTextNode(` ${label}`));
  } else {
    anchor.textContent = label;
  }

  anchor.setAttribute('aria-label', `${label} di halaman ini`);
}

export function configureSubmissionLink(anchor, label) {
  if (!anchor) return anchor;
  anchor.href = SUBMISSION_PORTAL_URL;
  anchor.removeAttribute('target');
  anchor.removeAttribute('rel');
  anchor.referrerPolicy = 'no-referrer';
  if (label) anchor.setAttribute('aria-label', `${label} di halaman ini`);
  return anchor;
}

function bridgeSubmissionLinks() {
  const container = document.querySelector('[data-contribution-page-actions]');
  if (!container) return 0;

  let updated = 0;
  container.querySelectorAll('a[href]').forEach((anchor) => {
    if (anchor.dataset.pepkSubmissionBridged === 'true') return;
    if (!isLegacySubmissionLink(anchor)) return;

    const module = moduleFromContext(anchor);
    if (!module) return;

    anchor.dataset.pepkSubmissionBridged = 'true';
    anchor.dataset.submissionModule = module;
    configureSubmissionLink(anchor);
    setAccessibleLabel(anchor, MODULE_LABELS[module]);
    updated += 1;
  });

  return updated;
}

function initializeBridge() {
  const container = document.querySelector('[data-contribution-page-actions]');
  if (!container) return;

  bridgeSubmissionLinks();

  const observer = new MutationObserver(() => {
    bridgeSubmissionLinks();
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBridge, { once: true });
} else {
  initializeBridge();
}
