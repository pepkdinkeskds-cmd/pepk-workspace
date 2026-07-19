import { createElement, externalLink, safeUrl } from "./app.js";
import { icon } from "./icons.js";
import { agendaStatus, formatAgendaDate, formatMetricValue, formatShortAgendaDate, formatTimeRange, realizationProgress } from "./information-utils.js";

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

export function realizationCard(item, { compact = false } = {}) {
  const progress = realizationProgress(item);
  const target = formatMetricValue(item.target, item.unit);
  const article = createElement("article", { className: `realization-card${compact ? " realization-card--compact" : ""}` });
  const progressTrack = createElement("progress", {
    className: "realization-card__progress",
    value: progress.percent,
    max: 100,
    "aria-label": `${item.title}: ${formatMetricValue(item.value, item.unit)} dari target ${target}`
  });

  article.append(
    createElement("span", { className: "realization-card__top" }, [
      createElement("span", { className: "realization-card__icon", html: icon("trend") }),
      createElement("span", { className: "realization-card__period", text: item.period || "Periode berjalan" })
    ]),
    createElement("h3", { className: "realization-card__title", text: item.title }),
    createElement("strong", { className: "realization-card__value", text: formatMetricValue(item.value, item.unit) }),
    createElement("span", { className: "realization-card__target", text: `Target periode ${target}` }),
    progressTrack,
    createElement("span", { className: "realization-card__attainment", text: item.target > 0 ? `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(progress.attainment)}% dari target` : "Target belum ditentukan" }),
    !compact && item.description ? createElement("p", { className: "realization-card__description", text: item.description }) : null,
    item.updatedAt ? createElement("span", { className: "realization-card__updated", text: `Diperbarui ${formatAgendaDate(item.updatedAt)}` }) : null
  );
  return article;
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
