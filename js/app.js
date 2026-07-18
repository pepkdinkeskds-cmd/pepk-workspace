import { CONFIG } from "./config.js";
import { hydrateIcons, icon } from "./icons.js";

export function initApp(activePage) {
  hydrateIcons();
  document.documentElement.classList.add("js");

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === activePage) link.setAttribute("aria-current", "page");
  });

  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-mobile-nav]");
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
      menuButton.innerHTML = icon(open ? "menu" : "close");
    });

    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      menu.hidden = true;
      menuButton.innerHTML = icon("menu");
    }));
  }

  document.querySelectorAll("[data-version]").forEach((node) => { node.textContent = CONFIG.appVersion; });
  document.querySelectorAll("[data-updated]").forEach((node) => { node.textContent = CONFIG.contentUpdatedAt; });
}

export function applyMetadata(settings = {}) {
  const updated = settings.contentUpdatedAt || CONFIG.contentUpdatedAt;
  document.querySelectorAll("[data-version]").forEach((node) => { node.textContent = CONFIG.appVersion; });
  document.querySelectorAll("[data-updated]").forEach((node) => { node.textContent = updated; });
}

export function setDataStatus(message, state = "ready") {
  const node = document.querySelector("[data-data-status]");
  if (!node) return;
  node.dataset.state = state;
  node.textContent = message;
}

export function debounce(fn, wait = CONFIG.searchDebounceMs) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function createElement(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.entries(value).forEach(([dataKey, dataValue]) => { node.dataset[dataKey] = dataValue; });
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  });
  const values = Array.isArray(children) ? children : [children];
  values.filter(Boolean).forEach((child) => node.append(child instanceof Node ? child : document.createTextNode(String(child))));
  return node;
}

export function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch {
    return "#";
  }
}

export function externalLink(url, label, className = "") {
  return createElement("a", {
    className,
    href: safeUrl(url),
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": `${label} — terbuka di tab baru`
  });
}

export function announce(message) {
  const node = document.querySelector("[data-live-region]");
  if (node) node.textContent = message;
}

export function scrollResultsIntoView(selector) {
  const node = document.querySelector(selector);
  if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
}
