export const CONFIG = Object.freeze({
  spreadsheetId: "1rSbyazj5MSdRYHgBYLBA7jeMjYKattvRPCG9SKHSxCM",
  appVersion: "0.9.7 RC2",
  contentUpdatedAt: "Belum tersinkron",
  catalogPackagedAt: "20 Oktober 2026",
  fetchTimeoutMs: 12000,
  searchDebounceMs: 180,
  backgroundSyncDelayMs: 400,
  cacheTtlMs: 300000,
  cacheSchema: 3,
  embedParam: "embed",
  sheets: {
    resources: "Resources",
    workspaces: "Workspaces",
    quickAccess: "Quick_Access",
    information: "Information",
    agenda: "Agenda",
    realization: "Realization",
    monevMaterials: "Monev_Materials",
    synonyms: "Synonyms",
    settings: "Settings",
    searchIndex: "Search_Index"
  },
  pageSections: {
    home: ["resources", "workspaces", "quickAccess", "settings", "agenda", "realization", "synonyms"],
    resources: ["resources", "workspaces", "synonyms", "settings"],
    workspace: ["resources", "workspaces", "synonyms", "settings"],
    information: ["information", "agenda", "realization", "settings"],
    about: ["resources", "workspaces", "settings"],
    monev: ["monevMaterials", "settings"]
  }
});
