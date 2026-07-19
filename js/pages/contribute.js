import { initApp, applyMetadata, setDataStatus, scheduleBackgroundTask, createElement, externalLink } from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js";
import { icon } from "../icons.js";

initApp("contribute");
let data = getInitialData();
applyMetadata(data.settings);

const container = document.querySelector("[data-contribution-page-actions]");

function actionCard({ iconName, eyebrow, title, description, url, buttonLabel, unavailableText }) {
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
      createElement("p", { className: "contribution-action-card__hint", text: "Administrator perlu menjalankan setup Apps Script dan menyimpan URL formulir pada sheet Settings." })
    );
  }
  return card;
}

function render() {
  container.replaceChildren(
    actionCard({
      iconName: "upload",
      eyebrow: "Dokumen",
      title: "Unggah Dokumen",
      description: "Kirim file ke antrean pemeriksaan dengan memilih ruang kerja, kelompok dokumen, tahun, dan subfolder tujuan.",
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
    })
  );
}

render();
setDataStatus("Siap digunakan", "ready");

scheduleBackgroundTask(async () => {
  setDataStatus("Memeriksa pembaruan…", "loading");
  try {
    const result = await refreshFromSheets();
    if (result.changed) {
      data = result.data;
      applyMetadata(data.settings);
      render();
    }
    if (result.partialFailure) setDataStatus("Data lokal aktif", "warning", `Sebagian sumber belum dapat dibaca: ${result.failedSheets.join(", ")}.`);
    else setDataStatus(result.changed ? "Data tersinkron" : "Siap digunakan", result.changed ? "connected" : "ready");
  } catch {
    setDataStatus("Data lokal aktif", "warning", "Google Sheets belum dapat dihubungi.");
  }
});
