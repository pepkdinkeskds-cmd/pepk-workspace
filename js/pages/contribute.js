import { initApp, createElement, externalLink } from "../app.js?v=0.9.7-rc4";
import { setContentStatus } from "../status.js?v=0.9.7-rc4";
import { icon } from "../icons.js?v=0.9.7-rc4";
import { SUBMISSION_PORTAL_URL, configureSubmissionLink } from "./submission-portal-bridge.js?v=0.9.7-rc4";

initApp("contribute");

const container = document.querySelector("[data-contribution-page-actions]");

function actionCard({ iconName, eyebrow, title, description, url, buttonLabel, module, variant = "primary", details = [] }) {
  const card = url
    ? externalLink(url, title, `contribution-action-card contribution-action-card--${variant} contribution-action-card--clickable`)
    : createElement("article", { className: `contribution-action-card contribution-action-card--${variant}` });
  const heading = createElement("div", { className: "contribution-action-card__heading" }, [
    createElement("span", { className: "contribution-action-card__icon", html: icon(iconName) }),
    createElement("span", { className: "contribution-action-card__eyebrow", text: eyebrow })
  ]);
  const content = createElement("div", { className: "contribution-action-card__content" }, [
    heading,
    createElement("h2", { text: title }),
    createElement("p", { text: description })
  ]);
  if (details.length) {
    content.append(createElement("ul", { className: "contribution-action-card__details" },
      details.map((detail) => createElement("li", { html: `${icon("check")}<span>${detail}</span>` }))
    ));
  }
  card.append(
    content,
    createElement("span", {
      className: `contribution-action-card__end contribution-action-card__end--${url ? "action" : "info"}`,
      html: url
        ? `<strong>${buttonLabel}</strong>${icon("arrow")}`
        : icon("inbox")
    })
  );
  if (url) {
    configureSubmissionLink(card, `Buka ${title} di Submission Portal`, module);
  }
  return card;
}

function render() {
  container.replaceChildren(
    ...[
      ['document', 'upload', 'Ajukan Dokumen', 'Kirim dokumen kerja ke ruang kerja dan periode yang tepat.'],
      ['agenda', 'calendar', 'Ajukan Agenda', 'Kirim jadwal kegiatan, lokasi, dan PIC untuk diperiksa operator.'],
      ['monev', 'presentation', 'Ajukan Materi Monev', 'Kirim bahan paparan sesuai unit dan periode pelaksanaan.'],
      ['reference', 'library', 'Ajukan Referensi', 'Kirim regulasi, pedoman, dan bahan pendukung pekerjaan.']
    ].map(([module, iconName, title, description]) => actionCard({ module, iconName, title, description, eyebrow: 'Pengajuan PEPK', url: SUBMISSION_PORTAL_URL, buttonLabel: 'Buka pengajuan' })),
    actionCard({
      iconName: "inbox",
      eyebrow: "Status dan perbaikan",
      title: "Pantau melalui email",
      description: "Nomor pengajuan dan tautan status unik dikirim ke email pengirim. Gunakan tautan tersebut untuk melihat progres atau mengirim perbaikan.",
      variant: "status",
      details: [
        "Setiap pengajuan memiliki tautan yang berbeda.",
        "Email pengirim digunakan sebagai verifikasi.",
        "Tidak perlu mencari atau memasukkan token secara manual."
      ]
    })
  );
}

render();
setContentStatus("Pilihan layanan tersedia", "ready", "Status pengiriman ditentukan saat Submission Portal dibuka.");
