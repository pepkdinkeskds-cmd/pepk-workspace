import {
  initApp,
  applyMetadata,
  setDataStatus,
  scheduleBackgroundTask,
  createElement,
  externalLink,
  debounce,
  updateQueryString,
  announce
} from "../app.js";
import { getInitialData, refreshFromSheets } from "../data/data-service.js?v=0.9.5-intent-search";
import { emptyState } from "../ui.js";
import { icon } from "../icons.js";

initApp("contribute");
let data = getInitialData();
applyMetadata(data.settings);

const form = document.querySelector("[data-monev-filter-form]");
const list = document.querySelector("[data-monev-material-list]");
const empty = document.querySelector("[data-monev-empty]");
const summary = document.querySelector("[data-monev-summary]");
const countNode = document.querySelector("[data-monev-result-count]");
const detailNode = document.querySelector("[data-monev-result-detail]");
const uploadLink = document.querySelector("[data-monev-upload-link]");
const params = new URLSearchParams(window.location.search);

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const state = {
  q: params.get("q") || "",
  year: params.get("year") || "",
  month: params.get("month") || "",
  sender: params.get("sender") || "",
  type: params.get("type") || "",
  sort: params.get("sort") || "presentation"
};

function normalized(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function periodLabel(item) {
  return `${MONTHS[Number(item.month) - 1] || "Bulan"} ${item.year}`;
}

function fillSelect(name, values, formatter = (value) => value) {
  const select = form.elements[name];
  const current = state[name];
  [...select.options].slice(1).forEach((option) => option.remove());
  values.forEach((value) => select.append(createElement("option", { value: String(value), text: formatter(value) })));
  select.value = current;
}

function populateFilters() {
  const materials = data.monevMaterials || [];
  const years = [...new Set(materials.map((item) => item.year))].sort((a, b) => b - a);
  const months = [...new Set(materials.map((item) => item.month))].sort((a, b) => a - b);
  const fileTypes = [...new Set(materials.map((item) => item.fileType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
  fillSelect("year", years);
  fillSelect("month", months, (value) => MONTHS[Number(value) - 1] || value);
  fillSelect("type", fileTypes);
  Object.entries(state).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
}

function filteredMaterials() {
  const query = normalized(state.q);
  const items = (data.monevMaterials || []).filter((item) => {
    const haystack = normalized([item.title, item.unitName, item.presenter, item.fileName, item.description, item.senderType, item.fileType].join(" "));
    return (!query || haystack.includes(query))
      && (!state.year || String(item.year) === state.year)
      && (!state.month || String(item.month) === state.month)
      && (!state.sender || normalized(item.senderType) === normalized(state.sender))
      && (!state.type || normalized(item.fileType) === normalized(state.type));
  });
  return items.sort((a, b) => {
    if (state.sort === "latest") return b.year - a.year || b.month - a.month || a.presentationOrder - b.presentationOrder;
    if (state.sort === "unit") return a.unitName.localeCompare(b.unitName, "id") || a.presentationOrder - b.presentationOrder;
    if (state.sort === "title") return a.title.localeCompare(b.title, "id");
    return b.year - a.year || b.month - a.month || a.presentationOrder - b.presentationOrder || a.unitName.localeCompare(b.unitName, "id");
  });
}

function summaryCard(value, label, iconName) {
  return createElement("span", { className: "monev-summary-card" }, [
    createElement("span", { className: "monev-summary-card__icon", html: icon(iconName) }),
    createElement("span", {}, [createElement("strong", { text: String(value) }), createElement("span", { text: label })])
  ]);
}

function renderSummary() {
  const items = data.monevMaterials || [];
  const latest = items.length ? [...items].sort((a, b) => b.year - a.year || b.month - a.month)[0] : null;
  const latestItems = latest ? items.filter((item) => item.year === latest.year && item.month === latest.month) : [];
  summary.replaceChildren(
    summaryCard(items.length, "Total materi", "document"),
    summaryCard(latest ? periodLabel(latest) : "—", "Periode terbaru", "calendar"),
    summaryCard(latestItems.filter((item) => normalized(item.senderType) === "bidang").length, "Materi Bidang terbaru", "report"),
    summaryCard(latestItems.filter((item) => normalized(item.senderType) === "puskesmas").length, "Materi Puskesmas terbaru", "home")
  );
}

function materialRow(item) {
  const article = createElement("article", { className: "monev-material-card" });
  const order = Number.isFinite(item.presentationOrder) && item.presentationOrder < 999
    ? String(item.presentationOrder).padStart(2, "0")
    : "—";
  const content = createElement("div", { className: "monev-material-card__content" }, [
    createElement("div", { className: "monev-material-card__badges" }, [
      createElement("span", { text: periodLabel(item) }),
      createElement("span", { text: item.senderType }),
      createElement("span", { text: item.fileType })
    ]),
    createElement("h2", { className: "monev-material-card__title", text: item.title }),
    createElement("p", { className: "monev-material-card__unit", text: item.unitName }),
    item.presenter ? createElement("p", { className: "monev-material-card__presenter", text: `Penyaji: ${item.presenter}` }) : null,
    item.description ? createElement("p", { className: "monev-material-card__description", text: item.description }) : null,
    createElement("p", { className: "monev-material-card__file", text: item.fileName })
  ].filter(Boolean));
  const actions = createElement("div", { className: "monev-material-card__actions" });
  const fileLink = externalLink(item.fileUrl, item.title, "button button--primary button--small");
  fileLink.innerHTML = `${icon("external")} Buka Materi`;
  actions.append(fileLink);
  if (item.folderUrl) {
    const folderLink = externalLink(item.folderUrl, `Folder ${item.unitName}`, "button button--secondary button--small");
    folderLink.innerHTML = `${icon("folderOpen")} Buka Folder`;
    actions.append(folderLink);
  }
  article.append(createElement("span", { className: "monev-material-card__order", text: order, "aria-label": `Urutan presentasi ${order}` }), content, actions);
  return article;
}

function render() {
  populateFilters();
  renderSummary();
  const items = filteredMaterials();
  list.replaceChildren(...items.map(materialRow));
  empty.replaceChildren();
  countNode.textContent = `${items.length} materi`;
  const active = [state.year && `Tahun ${state.year}`, state.month && MONTHS[Number(state.month) - 1], state.sender, state.type, state.q && `“${state.q}”`].filter(Boolean);
  detailNode.textContent = active.length ? `Filter: ${active.join(" • ")}` : "Seluruh materi yang telah disetujui administrator";
  uploadLink.href = data.settings.monevMaterialFormUrl || "contribute.html";
  if (data.settings.monevMaterialFormUrl) {
    uploadLink.target = "_blank";
    uploadLink.rel = "noopener noreferrer";
  }
  if (!items.length) empty.append(emptyState("Materi belum ditemukan", "Ubah filter atau unggah materi Monev melalui Pusat Layanan.", "presentation", { label: "Buka Pusat Layanan", href: "contribute.html" }));
  announce(`${items.length} materi Monev ditampilkan.`);
}

function syncState() {
  ["q", "year", "month", "sender", "type", "sort"].forEach((key) => { state[key] = String(form.elements[key]?.value || "").trim(); });
  updateQueryString(state);
  render();
}

form.elements.q.value = state.q;
form.addEventListener("input", debounce((event) => { if (event.target.name === "q") syncState(); }, 180));
form.addEventListener("change", syncState);
form.addEventListener("reset", () => {
  window.setTimeout(() => {
    Object.assign(state, { q: "", year: "", month: "", sender: "", type: "", sort: "presentation" });
    updateQueryString(state);
    render();
  }, 0);
});

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
