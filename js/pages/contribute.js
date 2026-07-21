import { initApp, applyMetadata, setDataStatus, scheduleBackgroundTask, createElement, externalLink } from "../app.js";
import { getInitialData, refreshSettingsFromSheets } from "../data/data-service.js?v=0.9.5-intent-search";
import { icon } from "../icons.js";

initApp("contribute");
let data = getInitialData();
applyMetadata(data.settings);

const container = document.querySelector("[data-contribution-page-actions]");

function actionCard({ iconName, eyebrow, title, description, url, buttonLabel, unavailableText, secondaryLink }) {
  const card = createElement("article", { className: "contribution-action-card" });
  const heading = createElement("div", { className: "contribution-action-card__heading" }, [
    createElement("span", { className: "contribution-action-card__icon", html: icon(iconName) }),
    createElement("span", { className: "contribution-action-card__eyebrow", text: eyebrow })
  ]);
  card.append(
    heading,
    createElement("h2", { text: title }),
    createElement("p", { text: description })
  );
  if (url) {
    const link = externalLink(url, title, "button button--primary contribution-action-card__button");
    link.innerHTML = `${icon(iconName)} ${buttonLabel}`;
    card.append(link);
  } else {
    card.append(
      createElement("span", { className: "contribution-action-card__status", text: unavailableText }),
      createElement("p", { className: "contribution-action-card__hint", text: "Tautan formulir diambil langsung dari sheet Settings V2. Pastikan spreadsheet dapat dibaca sebagai Viewer." })
    );
  }
  if (secondaryLink) {
    card.append(createElement("a", { className: "text-link contribution-action-card__secondary", href: secondaryLink.href, html: `${secondaryLink.label} ${icon("arrow")}` }));
  }
  return card;
}

function render() {
  container.replaceChildren(
    actionCard({
      iconName: "upload",
      eyebrow: "Dokumen",
      title: "Unggah Dokumen",
      description: "Kirim file ke antrean pemeriksaan dengan memilih ruang kerja dan tujuan folder yang telah disinkronkan dari Google Drive.",
      url: data.settings.workflowEnabled !== false ? data.settings.documentUploadFormUrl : "",
      buttonLabel: "Buka formulir unggah",
      unavailableText: "Formulir unggah belum dikonfigurasi"
    }),
    actionCard({
      iconName: "send",
      eyebrow: "Agenda",
      title: "Tambah Agenda",
      description: "Kirim jadwal rapat atau kegiatan beserta tanggal, waktu, lokasi, PIC, dan tautan bahan pendukung.",
      url: data.settings.workflowEnabled !== false ? data.settings.agendaSubmitFormUrl : "",
      buttonLabel: "Buka formulir agenda",
      unavailableText: "Formulir agenda belum dikonfigurasi"
    }),
    actionCard({
      iconName: "presentation",
      eyebrow: "Materi Monev",
      title: "Unggah Materi Monev",
      description: "Kirim PowerPoint, PDF, Word, atau Excel untuk rapat monitoring dan evaluasi capaian anggaran bulanan.",
      url: data.settings.workflowEnabled !== false ? data.settings.monevMaterialFormUrl : "",
      buttonLabel: "Buka formulir Monev",
      unavailableText: "Formulir Materi Monev belum dikonfigurasi",
      secondaryLink: { href: "monev.html", label: "Buka pustaka materi" }
    })
  );
}

render();
setDataStatus("Memuat tautan layanan…", "loading");

scheduleBackgroundTask(async () => {
  try {
    data.settings = await refreshSettingsFromSheets();
    applyMetadata(data.settings);
    render();
    setDataStatus("Tautan layanan tersinkron", "connected", "URL formulir dibaca langsung dari sheet Settings V2.");
  } catch {
    render();
    setDataStatus("Tautan layanan belum termuat", "warning", "Pastikan Spreadsheet V2 dibagikan sebagai Viewer kepada siapa saja yang memiliki link.");
  }
});
