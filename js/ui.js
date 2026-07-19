import { createElement, externalLink, safeUrl } from "./app.js";
import { icon } from "./icons.js";
import {
  agendaStatus,
  formatAgendaDate,
  formatPercentage,
  formatShortAgendaDate,
  formatTimeRange,
  monthName,
  realizationDeviation,
  realizationForYear,
  realizationPeriod
} from "./information-utils.js";

function resourceMeta(resource) {
  const items = [resource.workspaceTitle || resource.workspaceId];
  if (resource.type === "application") items.push(resource.category || "Aplikasi");
  else if (resource.year) items.push(String(resource.year));
  return items;
}

function appLogo(resource, className = "") {
  const image = createElement("img", {
    className: `app-logo ${className}`.trim(),
    src: safeUrl(resource.icon || ""),
    alt: "",
    width: 48,
    height: 48,
    loading: "lazy",
    decoding: "async"
  });
  image.addEventListener("error", () => {
    const fallback = createElement("span", {
      className: `app-logo app-logo--fallback ${className}`.trim(),
      text: resource.title.slice(0, 2).toUpperCase()
    });
    image.replaceWith(fallback);
  }, { once: true });
  return image;
}

export function applicationCard(resource, { compact = false } = {}) {
  const link = externalLink(resource.url, resource.title, `application-card${compact ? " application-card--compact" : ""}`);
  const logo = appLogo(resource, "application-card__logo");
  const content = createElement("span", { className: "application-card__content" }, [
    createElement("span", { className: "application-card__meta", text: resource.category || resource.workspaceTitle || resource.workspaceId }),
    createElement("strong", { className: "application-card__title", text: resource.title })
  ]);
  if (!compact) content.append(createElement("span", { className: "application-card__description", text: resource.description || "" }));
  link.append(logo, content, createElement("span", { className: "application-card__action", html: icon("external") }));
  return link;
}

export function resourceCard(resource, { compact = false } = {}) {
  if (resource.type === "application") return applicationCard(resource, { compact });
  const link = externalLink(resource.url, resource.title, `resource-card${compact ? " resource-card--compact" : ""}`);
  const iconBox = createElement("span", { className: "resource-card__icon", html: icon(resource.icon || "folder") });
  const content = createElement("span", { className: "resource-card__content" });
  const meta = createElement("span", { className: "resource-card__meta" }, resourceMeta(resource).map((item) => createElement("span", { text: item })));
  const title = createElement("strong", { className: "resource-card__title", text: resource.title });
  const description = createElement("span", { className: "resource-card__description", text: resource.description || "" });
  content.append(meta, title);
  if (!compact) content.append(description);
  const action = createElement("span", { className: "resource-card__action", html: icon("external") });
  link.append(iconBox, content, action);
  return link;
}

export function workspaceCard(workspace, counts = {}) {
  const link = createElement("a", {
    className: `workspace-card workspace-card--${workspace.id}`,
    href: `workspace.html?id=${encodeURIComponent(workspace.id)}`
  });
  const top = createElement("span", { className: "workspace-card__top" }, [
    createElement("span", { className: "workspace-card__icon", html: icon(workspace.icon || "folder") }),
    createElement("span", { className: "workspace-card__arrow", html: icon("arrow") })
  ]);
  const title = createElement("strong", { className: "workspace-card__title", text: workspace.title });
  const description = createElement("span", { className: "workspace-card__description", text: workspace.description });
  const apps = counts.applications || workspace.applicationCount || 0;
  const metaText = `${counts.groups || workspace.groupCount || 0} kelompok • ${counts.documents || workspace.resourceCount || 0} folder${apps ? ` • ${apps} aplikasi` : ""}`;
  const meta = createElement("span", { className: "workspace-card__meta", text: metaText });
  link.append(top, title, description, meta);
  return link;
}

export function informationCard(item) {
  const article = createElement("article", { className: "information-card" });
  article.append(
    createElement("span", { className: "information-card__icon", html: icon(item.icon || "info") }),
    createElement("div", { className: "information-card__content" }, [
      createElement("h3", { className: "information-card__title", text: item.title }),
      createElement("p", { className: "information-card__summary", text: item.summary }),
      createElement("a", { className: "text-link", href: `information.html?id=${encodeURIComponent(item.id)}`, html: `Baca informasi ${icon("arrow")}` })
    ])
  );
  return article;
}

export function agendaCard(item, { compact = false } = {}) {
  const status = agendaStatus(item);
  const wrapper = item.url
    ? externalLink(item.url, item.title, `agenda-card${compact ? " agenda-card--compact" : ""}`)
    : createElement("article", { className: `agenda-card${compact ? " agenda-card--compact" : ""}` });

  const dateParts = formatShortAgendaDate(item.date).split(" ");
  const dateBox = createElement("span", { className: "agenda-card__date", "aria-hidden": "true" }, [
    createElement("strong", { text: dateParts[0] || "—" }),
    createElement("span", { text: dateParts.slice(1).join(" ") || "" })
  ]);

  const content = createElement("span", { className: "agenda-card__content" }, [
    createElement("span", { className: `agenda-card__status agenda-card__status--${status.key}`, text: status.label }),
    createElement("strong", { className: "agenda-card__title", text: item.title }),
    createElement("span", { className: "agenda-card__full-date", text: formatAgendaDate(item.date) }),
    createElement("span", { className: "agenda-card__details" }, [
      createElement("span", {}, [createElement("span", { html: icon("clock") }), createElement("span", { text: formatTimeRange(item.startTime, item.endTime) })]),
      item.location ? createElement("span", {}, [createElement("span", { html: icon("location") }), createElement("span", { text: item.location })]) : null,
      item.pic ? createElement("span", {}, [createElement("span", { html: icon("user") }), createElement("span", { text: `PIC: ${item.pic}` })]) : null
    ]),
    !compact && item.description ? createElement("span", { className: "agenda-card__description", text: item.description }) : null
  ]);

  wrapper.append(dateBox, content);
  if (item.url) wrapper.append(createElement("span", { className: "agenda-card__action", html: icon("external") }));
  return wrapper;
}

function metricProgress(label, value, kind) {
  const progress = createElement("progress", {
    className: `realization-metric__progress realization-metric__progress--${kind}`,
    value: Math.max(0, Math.min(100, Number(value) || 0)),
    max: 100,
    "aria-label": `${label}: ${formatPercentage(value)}`
  });
  return createElement("div", { className: `realization-metric realization-metric--${kind}` }, [
    createElement("span", { className: "realization-metric__heading" }, [
      createElement("span", { text: label }),
      createElement("strong", { text: formatPercentage(value) })
    ]),
    progress
  ]);
}

export function realizationCard(item, { compact = false, balancedThreshold = 2, attentionThreshold = 5 } = {}) {
  const deviation = realizationDeviation(item, balancedThreshold, attentionThreshold);
  const article = createElement("article", { className: `realization-card realization-card--combined${compact ? " realization-card--compact" : ""}` });
  const children = [
    createElement("span", { className: "realization-card__top" }, [
      createElement("span", { className: "realization-card__icon", html: icon("trend") }),
      createElement("span", { className: "realization-card__period", text: realizationPeriod(item) })
    ]),
    createElement("h3", { className: "realization-card__title", text: "Realisasi keuangan dan fisik" }),
    createElement("div", { className: "realization-card__metrics" }, [
      metricProgress("Keuangan", item.financialValue, "financial"),
      metricProgress("Fisik", item.physicalValue, "physical")
    ]),
    createElement("div", { className: `realization-deviation realization-deviation--${deviation.severity}` }, [
      createElement("span", { className: "realization-deviation__label", text: "Deviasi" }),
      createElement("strong", { className: "realization-deviation__value", text: deviation.value === null ? "—" : `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, signDisplay: "always" }).format(deviation.value)} poin` }),
      createElement("span", { className: "realization-deviation__description", text: deviation.label })
    ]),
    !compact && item.description && String(item.description).trim().toLowerCase() !== "null"
      ? createElement("p", { className: "realization-card__description", text: item.description })
      : null,
    item.updatedAt
      ? createElement("span", { className: "realization-card__updated", text: `Diperbarui ${formatAgendaDate(item.updatedAt)}` })
      : null
  ].filter(Boolean);
  article.append(...children);
  return article;
}

function svgNode(name, attributes = {}, text = "") {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (text) node.textContent = text;
  return node;
}

function lineSegments(points) {
  const segments = [];
  let current = [];
  points.forEach((point) => {
    if (!point) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push(point);
  });
  if (current.length) segments.push(current);
  return segments;
}

export function realizationChart(items, year) {
  const series = realizationForYear(items, year);
  const byMonth = new Map(series.map((item) => [Number(item.month), item]));
  const width = 860;
  const height = 330;
  const margin = { top: 28, right: 28, bottom: 54, left: 54 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x = (month) => margin.left + ((month - 1) / 11) * innerWidth;
  const y = (value) => margin.top + innerHeight - (Math.max(0, Math.min(100, Number(value) || 0)) / 100) * innerHeight;

  const wrapper = createElement("div", { className: "realization-chart" });
  const legend = createElement("div", { className: "realization-chart__legend" }, [
    createElement("span", { className: "realization-chart__legend-item realization-chart__legend-item--financial", text: "Keuangan" }),
    createElement("span", { className: "realization-chart__legend-item realization-chart__legend-item--physical", text: "Fisik" })
  ]);
  const svg = svgNode("svg", {
    class: "realization-chart__svg",
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": `Grafik perkembangan realisasi keuangan dan fisik tahun ${year}`
  });
  svg.append(svgNode("title", {}, `Perkembangan realisasi tahun ${year}`));
  svg.append(svgNode("desc", {}, "Garis biru menunjukkan realisasi keuangan dan garis hijau menunjukkan capaian fisik pada skala nol sampai seratus persen."));

  [0, 25, 50, 75, 100].forEach((tick) => {
    const yy = y(tick);
    svg.append(svgNode("line", { x1: margin.left, y1: yy, x2: width - margin.right, y2: yy, class: "realization-chart__grid" }));
    svg.append(svgNode("text", { x: margin.left - 10, y: yy + 4, class: "realization-chart__axis-label", "text-anchor": "end" }, `${tick}%`));
  });

  for (let month = 1; month <= 12; month += 1) {
    svg.append(svgNode("text", { x: x(month), y: height - 20, class: "realization-chart__month", "text-anchor": "middle" }, monthName(month, true)));
  }

  const financialPoints = Array.from({ length: 12 }, (_, index) => {
    const item = byMonth.get(index + 1);
    return item ? [x(index + 1), y(item.financialValue), item] : null;
  });
  const physicalPoints = Array.from({ length: 12 }, (_, index) => {
    const item = byMonth.get(index + 1);
    return item ? [x(index + 1), y(item.physicalValue), item] : null;
  });

  [[financialPoints, "financial"], [physicalPoints, "physical"]].forEach(([points, kind]) => {
    lineSegments(points).forEach((segment) => {
      svg.append(svgNode("polyline", {
        points: segment.map(([px, py]) => `${px},${py}`).join(" "),
        class: `realization-chart__line realization-chart__line--${kind}`,
        fill: "none"
      }));
    });
    points.filter(Boolean).forEach(([px, py, item]) => {
      const value = kind === "financial" ? item.financialValue : item.physicalValue;
      const point = svgNode("circle", { cx: px, cy: py, r: 5, class: `realization-chart__point realization-chart__point--${kind}` });
      point.append(svgNode("title", {}, `${monthName(item.month)}: ${formatPercentage(value)}`));
      svg.append(point);
    });
  });

  wrapper.append(legend, svg);
  return wrapper;
}

export function realizationTable(items, year, balancedThreshold = 2, attentionThreshold = 5) {
  const byMonth = new Map(realizationForYear(items, year).map((item) => [Number(item.month), item]));
  const table = createElement("table", { className: "realization-table" });
  table.append(createElement("thead", {}, [createElement("tr", {}, [
    createElement("th", { scope: "col", text: "Bulan" }),
    createElement("th", { scope: "col", text: "Keuangan" }),
    createElement("th", { scope: "col", text: "Fisik" }),
    createElement("th", { scope: "col", text: "Deviasi" }),
    createElement("th", { scope: "col", text: "Keterangan" })
  ])]));
  const body = createElement("tbody");
  for (let month = 1; month <= 12; month += 1) {
    const item = byMonth.get(month);
    const deviation = item ? realizationDeviation(item, balancedThreshold, attentionThreshold) : null;
    body.append(createElement("tr", { className: item ? "" : "realization-table__empty-row" }, [
      createElement("th", { scope: "row", text: monthName(month) }),
      createElement("td", { text: item ? formatPercentage(item.financialValue) : "Belum tersedia" }),
      createElement("td", { text: item ? formatPercentage(item.physicalValue) : "Belum tersedia" }),
      createElement("td", { text: item ? `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, signDisplay: "always" }).format(deviation.value)} poin` : "—" }),
      createElement("td", {}, item ? [createElement("span", { className: `deviation-badge deviation-badge--${deviation.severity}`, text: deviation.label })] : [])
    ]));
  }
  table.append(body);
  return createElement("div", { className: "realization-table-wrap" }, [table]);
}

export function emptyState(title, description, iconName = "search", action = null) {
  const children = [
    createElement("span", { className: "empty-state__icon", html: icon(iconName) }),
    createElement("h2", { className: "empty-state__title", text: title }),
    createElement("p", { className: "empty-state__description", text: description })
  ];
  if (action?.label) {
    const button = createElement(action.href ? "a" : "button", {
      className: "button button--secondary empty-state__action",
      text: action.label,
      ...(action.href ? { href: action.href } : { type: "button" })
    });
    if (action.onClick) button.addEventListener("click", action.onClick);
    children.push(button);
  }
  return createElement("div", { className: "empty-state" }, children);
}

export function groupCard(group, resources) {
  const article = createElement("article", { className: "document-group" });
  const header = createElement("div", { className: "document-group__header" });
  header.append(
    createElement("span", { className: "document-group__icon", html: icon("folder") }),
    createElement("div", { className: "document-group__heading" }, [
      createElement("h3", { className: "document-group__title", text: group.title }),
      createElement("p", { className: "document-group__meta", text: `${resources.length} tahun tersedia` })
    ])
  );

  const yearList = createElement("div", { className: "year-list" });
  resources.slice().sort((a, b) => b.year - a.year).forEach((resource) => {
    const link = externalLink(resource.url, resource.title, "year-link");
    link.append(
      createElement("span", { className: "year-link__year", text: String(resource.year) }),
      createElement("span", { className: "year-link__detail" }, [
        createElement("strong", { text: `Buka ${group.title}` }),
        createElement("span", { text: resource.subfolders?.length ? resource.subfolders.map((item) => item.replace(/\b\w/g, (char) => char.toUpperCase())).join(" • ") : "Folder dokumen tahun" })
      ]),
      createElement("span", { className: "year-link__icon", html: icon("external") })
    );
    yearList.append(link);
  });

  article.append(header, yearList);
  return article;
}
