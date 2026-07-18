import { CONFIG } from "./config.js";
import { hydrateIcons, icon } from "./icons.js";

function isSameOriginInternalLink(link) {
  if (!link?.href || link.hasAttribute("download") || link.target === "_blank") return false;
  try {
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin && /\.html$|\/$/.test(url.pathname);
  } catch {
    return false;
  }
}

function detectEmbedMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get(CONFIG.embedParam) === "1") return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function preserveEmbedNavigation() {
  document.querySelectorAll("a[href]").forEach((link) => {
    if (!isSameOriginInternalLink(link)) return;
    const url = new URL(link.href, window.location.href);
    url.searchParams.set(CONFIG.embedParam, "1");
    link.href = `${url.pathname.split("/").pop() || "index.html"}${url.search}${url.hash}`;
  });
}

function createEmbedToolbar() {
  if (document.querySelector("[data-embed-toolbar]")) return;
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete(CONFIG.embedParam);

  const toolbar = createElement("div", { className: "embed-toolbar", dataset: { embedToolbar: "" } }, [
    createElement("a", { className: "embed-toolbar__brand", href: "index.html?embed=1", "aria-label": "PEPK Workspace — Beranda" }, [
      createElement("img", { src: "assets/logo-pepk.png", alt: "", width: 24, height: 36 }),
      createElement("strong", { text: "PEPK Workspace" })
    ]),
    createElement("a", {
      className: "embed-toolbar__open",
      href: currentUrl.href,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Buka PEPK Workspace dalam tab baru",
      html: `Buka penuh ${icon("external")}`
    })
  ]);
  document.body.prepend(toolbar);
}

function initEmbedMode() {
  if (!detectEmbedMode()) return;
  document.body.classList.add("is-embedded");
  createEmbedToolbar();
  preserveEmbedNavigation();
}

function initMobileMenu() {
  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-mobile-nav]");
  if (!menuButton || !menu) return;

  const setOpen = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
    menu.hidden = !open;
    menuButton.innerHTML = icon(open ? "close" : "menu");
  };

  menuButton.addEventListener("click", () => setOpen(menuButton.getAttribute("aria-expanded") !== "true"));
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (menuButton.getAttribute("aria-expanded") !== "true") return;
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) setOpen(false);
  });
}

export function initApp(activePage) {
  hydrateIcons();
  document.documentElement.classList.add("js");

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === activePage) link.setAttribute("aria-current", "page");
  });

  initMobileMenu();
  initEmbedMode();

  document.querySelectorAll("[data-version]").forEach((node) => { node.textContent = CONFIG.appVersion; });
  document.querySelectorAll("[data-updated]").forEach((node) => { node.textContent = CONFIG.contentUpdatedAt; });
}

export function applyMetadata(settings = {}) {
  const updated = settings.contentUpdatedAt || CONFIG.contentUpdatedAt;
  document.querySelectorAll("[data-version]").forEach((node) => { node.textContent = CONFIG.appVersion; });
  document.querySelectorAll("[data-updated]").forEach((node) => { node.textContent = updated; });
}

export function setDataStatus(message, state = "ready", detail = "") {
  document.querySelectorAll("[data-data-status]").forEach((node) => {
    node.dataset.state = state;
    node.textContent = message;
    if (detail) node.title = detail;
    else node.removeAttribute("title");
  });
}

export function debounce(fn, wait = CONFIG.searchDebounceMs) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function scheduleBackgroundTask(task, delay = CONFIG.backgroundSyncDelayMs) {
  if (new URLSearchParams(window.location.search).get("nosync") === "1") return;
  const run = () => Promise.resolve().then(task);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: delay + 1000 });
  } else {
    window.setTimeout(run, delay);
  }
}

export function createElement(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.entries(value).forEach(([dataKey, dataValue]) => { node.dataset[dataKey] = dataValue; });
    else if (value === false || value === null || value === undefined) return;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  });
  const values = Array.isArray(children) ? children : [children];
  values.filter((child) => child !== null && child !== undefined && child !== false).forEach((child) => node.append(child instanceof Node ? child : document.createTextNode(String(child))));
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
  const href = safeUrl(url);
  const link = createElement("a", {
    className,
    href,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": `${label} — terbuka di tab baru`
  });
  if (href === "#") {
    link.setAttribute("aria-disabled", "true");
    link.addEventListener("click", (event) => event.preventDefault());
  }
  return link;
}

export function announce(message) {
  const node = document.querySelector("[data-live-region]");
  if (!node) return;
  node.textContent = "";
  window.setTimeout(() => { node.textContent = message; }, 20);
}

export function minimumSearchLength(settings = {}) {
  const value = Number(settings.searchMinimum ?? 2);
  return Number.isFinite(value) && value > 0 ? value : 2;
}

export function updateQueryString(values, { mode = "replace" } = {}) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
    else params.delete(key);
  });
  if (document.body.classList.contains("is-embedded")) params.set(CONFIG.embedParam, "1");
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  history[mode === "push" ? "pushState" : "replaceState"](null, "", next);
}
