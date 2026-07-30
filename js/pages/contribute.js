import { initApp, createElement, externalLink } from "../app.js";
import { setContentStatus } from "../status.js?v=0.9.5-quality-07";
import { icon } from "../icons.js";
import { SUBMISSION_PORTAL_URL } from "./submission-portal-bridge.js?v=0.9.5-quality-07";

initApp("contribute");

const container = document.querySelector("[data-contribution-page-actions]");

function actionCard({ iconName, eyebrow, title, description, url, buttonLabel, variant = "primary", details = [] }) {
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
    card.setAttribute("aria-label", "Mulai Pengajuan PEPK di Submission Portal — terbuka di tab baru");
  }
  return card;
}

function render() {
  container.replaceChildren(
    actionCard({
      iconName: "upload",
      eyebrow: "Satu pintu layanan",
      title: "Mulai Pengajuan PEPK",
      description: "Gunakan satu Submission Portal untuk mengajukan Dokumen, Agenda, Materi Monev, atau Referensi.",
      url: SUBMISSION_PORTAL_URL,
      buttonLabel: "Mulai Pengajuan",
      details: [
        "Pilih satu dari empat jenis pengajuan setelah portal terbuka.",
        "Data masuk ke antrean pemeriksaan Operator.",
        "Tidak memerlukan akses Editor ke folder utama."
      ]
    }),
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
setContentStatus("Layanan siap digunakan", "connected", "Empat jenis pengajuan tersedia melalui PEPK Submission Portal.");
