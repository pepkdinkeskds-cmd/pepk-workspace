import { initApp, setDataStatus, createElement, externalLink } from "../app.js";
import { icon } from "../icons.js";
import { SUBMISSION_PORTAL_URL } from "./submission-portal-bridge.js";

initApp("contribute");

const container = document.querySelector("[data-contribution-page-actions]");

function actionCard({ iconName, eyebrow, title, description, url, buttonLabel, variant = "primary", details = [] }) {
  const card = createElement("article", { className: `contribution-action-card contribution-action-card--${variant}` });
  const heading = createElement("div", { className: "contribution-action-card__heading" }, [
    createElement("span", { className: "contribution-action-card__icon", html: icon(iconName) }),
    createElement("span", { className: "contribution-action-card__eyebrow", text: eyebrow })
  ]);
  card.append(
    heading,
    createElement("h2", { text: title }),
    createElement("p", { text: description })
  );
  if (details.length) {
    card.append(createElement("ul", { className: "contribution-action-card__details" },
      details.map((detail) => createElement("li", { html: `${icon("check")}<span>${detail}</span>` }))
    ));
  }
  if (url) {
    const link = externalLink(url, title, "button button--primary contribution-action-card__button");
    link.innerHTML = `${icon(iconName)} ${buttonLabel}`;
    link.setAttribute("aria-label", "Mulai Pengajuan PEPK di Submission Portal");
    card.append(link);
  }
  return card;
}

function render() {
  container.replaceChildren(
    actionCard({
      iconName: "upload",
      eyebrow: "Satu pintu layanan",
      title: "Mulai Pengajuan PEPK",
      description: "Gunakan satu Submission Portal untuk mengajukan dokumen, agenda, atau materi Monev.",
      url: SUBMISSION_PORTAL_URL,
      buttonLabel: "Mulai Pengajuan",
      details: [
        "Pilih jenis pengajuan setelah portal terbuka.",
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
setDataStatus("Layanan siap digunakan", "connected", "Pengajuan dilakukan melalui PEPK Submission Portal.");
