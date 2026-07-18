import { createElement, externalLink } from "./app.js";
import { icon } from "./icons.js";

export function resourceCard(resource, { compact = false } = {}) {
  const link = externalLink(resource.url, resource.title, `resource-card${compact ? " resource-card--compact" : ""}`);
  const iconBox = createElement("span", { className: "resource-card__icon", html: icon(resource.icon || "folder") });
  const content = createElement("span", { className: "resource-card__content" });
  const meta = createElement("span", { className: "resource-card__meta" }, [
    createElement("span", { text: resource.workspaceTitle || resource.workspaceId }),
    createElement("span", { text: String(resource.year || "") })
  ]);
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
  const meta = createElement("span", { className: "workspace-card__meta", text: `${counts.groups || workspace.groupCount || 0} kelompok • ${counts.resources || workspace.resourceCount || 0} folder tahun` });
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

export function emptyState(title, description, iconName = "search") {
  return createElement("div", { className: "empty-state" }, [
    createElement("span", { className: "empty-state__icon", html: icon(iconName) }),
    createElement("h2", { className: "empty-state__title", text: title }),
    createElement("p", { className: "empty-state__description", text: description })
  ]);
}

export function groupCard(group, resources) {
  const article = createElement("article", { className: "document-group" });
  const header = createElement("div", { className: "document-group__header" });
  header.append(
    createElement("span", { className: "document-group__icon", html: icon("folder") }),
    createElement("div", { className: "document-group__heading" }, [
      createElement("h2", { className: "document-group__title", text: group.title }),
      createElement("p", { className: "document-group__meta", text: `${resources.length} tahun tersedia` })
    ])
  );

  const yearList = createElement("div", { className: "year-list" });
  resources.sort((a, b) => b.year - a.year).forEach((resource) => {
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
