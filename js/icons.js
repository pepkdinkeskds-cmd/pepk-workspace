const ICONS = {
  apps: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.75 6.75A1.75 1.75 0 0 1 5.5 5h4l2 2h7A1.75 1.75 0 0 1 20.25 8.75v8.75a1.75 1.75 0 0 1-1.75 1.75h-13a1.75 1.75 0 0 1-1.75-1.75V6.75Z"/></svg>',
  folderOpen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.5V6.75A1.75 1.75 0 0 1 5.25 5h4l2 2h7A1.75 1.75 0 0 1 20 8.75V10M4.4 19h13.2a1.6 1.6 0 0 0 1.53-1.13l1.72-5.5A1.05 1.05 0 0 0 19.85 11H6.15a1.6 1.6 0 0 0-1.53 1.13L2.9 17.63A1.05 1.05 0 0 0 3.9 19Z"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6"/></svg>',
  library: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h5v15H5zM14 4.5h5v15h-5zM10 7h4M10 17h4"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10.5V17M12 7.2h.01"/></svg>',
  about: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5h6M9 3.5h6a1 1 0 0 1 1 1v2H8v-2a1 1 0 0 1 1-1Z"/><path d="M7 5.5H5.5A1.5 1.5 0 0 0 4 7v12a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V7a1.5 1.5 0 0 0-1.5-1.5H17M8 11h8M8 15h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20.5h18"/></svg>',
  report: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3 3V20.5H6z"/><path d="M15 3.5v4h4M9 12h6M9 16h6M9 8h2"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 8h14M15 12h5v4h-5a2 2 0 0 1 0-4Z"/></svg>',
  document: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3 3V20.5H6z"/><path d="M15 3.5v4h4M9 12h6M9 16h6"/></svg>',
  filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7 3.5v4M17 3.5v4M3.5 10h17"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.4-7 9-4.3-1.6-7-4.7-7-9V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5M7.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 20h18.4L12 4Z"/><path d="M12 9v5M12 17.3h.01"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.2 9A7 7 0 0 0 6.4 6.4L4 9M5.8 15A7 7 0 0 0 17.6 17.6L20 15"/></svg>'
};

export function icon(name, className = "") {
  const svg = ICONS[name] || ICONS.document;
  return `<span class="icon ${className}" aria-hidden="true">${svg}</span>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icon(node.dataset.icon, node.dataset.iconClass || "");
  });
}
