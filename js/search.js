function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function containsPhrase(text, phrase) {
  if (!phrase) return false;
  return (` ${text} `).includes(` ${phrase} `);
}

function tokenPrefixMatch(text, term) {
  if (!term || term.length < 4) return false;
  return tokens(text).some((token) => token.startsWith(term));
}

function variantMatches(text, variant) {
  return containsPhrase(text, variant) || tokenPrefixMatch(text, variant);
}

function buildRequirements(query, synonyms = []) {
  let remaining = ` ${normalize(query)} `;
  const requirements = [];

  const entries = synonyms
    .map((item) => [item.term, ...(Array.isArray(item.synonyms) ? item.synonyms : [])].map(normalize).filter(Boolean))
    .filter((variants) => variants.length)
    .sort((a, b) => Math.max(...b.map((variant) => variant.length)) - Math.max(...a.map((variant) => variant.length)));

  entries.forEach((variants) => {
    const matchedVariant = variants
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((variant) => containsPhrase(remaining.trim(), variant));

    if (matchedVariant) {
      requirements.push({ variants });
      remaining = remaining.replace(` ${matchedVariant} `, " ");
    }
  });

  tokens(remaining).forEach((token) => requirements.push({ variants: [token] }));
  return requirements;
}

function resourceRangeYears(resource) {
  const start = Number(resource.yearStart || resource.year || 0);
  const end = Number(resource.yearEnd || resource.year || start || 0);
  if (!start || !end || end < start || end - start > 100) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function normalizedFields(resource) {
  return {
    title: normalize(resource.title),
    description: normalize(resource.description),
    workspace: normalize(resource.workspaceTitle || resource.workspaceId),
    category: normalize(resource.category),
    period: normalize(resource.period),
    leafName: normalize(resource.leafName || ""),
    path: normalize(resource.path || ""),
    parentPath: normalize(resource.parentPath || ""),
    keywords: (resource.keywords || []).map(normalize),
    aliases: (resource.aliases || []).map(normalize),
    subfolders: (resource.subfolders || []).map(normalize)
  };
}

function searchableText(resource, fields = normalizedFields(resource)) {
  return normalize([
    fields.title,
    fields.description,
    fields.workspace,
    fields.category,
    fields.leafName,
    fields.path,
    fields.parentPath,
    resource.period,
    resource.year,
    resource.yearStart,
    resource.yearEnd,
    ...resourceRangeYears(resource),
    ...fields.keywords,
    ...fields.aliases,
    ...fields.subfolders
  ].join(" "));
}

function matchAllRequirements(haystack, requirements) {
  return requirements.every((requirement) => requirement.variants.some((variant) => variantMatches(haystack, variant)));
}

function scoreResource(resource, normalizedQuery, requirements) {
  const fields = normalizedFields(resource);
  const haystack = searchableText(resource, fields);
  if (!matchAllRequirements(haystack, requirements)) return 0;

  let score = requirements.length * 30;
  const queryTokens = tokens(normalizedQuery);
  const hasYear = queryTokens.some((token) => /^20\d{2}$/.test(token));
  const asksForApplication = queryTokens.some((token) => ["app", "aplikasi", "portal", "sistem"].includes(token));
  const asksForDocument = queryTokens.some((token) => ["folder", "dokumen", "berkas", "file"].includes(token));

  if (resource.kind === "deep-folder") {
    score += 70;
    if (fields.leafName === normalizedQuery) score += 360;
    if (fields.title === normalizedQuery) score += 320;
    if (fields.leafName.startsWith(normalizedQuery)) score += 190;
    if (containsPhrase(fields.leafName, normalizedQuery)) score += 170;
    if (containsPhrase(fields.path, normalizedQuery)) score += 95;
  }

  if (fields.title === normalizedQuery) score += 240;
  if (fields.aliases.includes(normalizedQuery)) score += 210;
  if (fields.title.startsWith(normalizedQuery)) score += 130;
  if (containsPhrase(fields.title, normalizedQuery)) score += 110;
  if (fields.category === normalizedQuery) score += 105;
  if (containsPhrase(fields.category, normalizedQuery)) score += 85;
  if (fields.workspace === normalizedQuery) score += 65;
  if (fields.aliases.some((alias) => containsPhrase(alias, normalizedQuery))) score += 95;
  if (fields.keywords.some((keyword) => containsPhrase(keyword, normalizedQuery))) score += 75;
  if (fields.subfolders.some((item) => containsPhrase(item, normalizedQuery))) score += 70;
  if (containsPhrase(fields.description, normalizedQuery)) score += 35;
  if (containsPhrase(haystack, normalizedQuery)) score += 45;

  requirements.forEach((requirement) => {
    if (resource.kind === "deep-folder" && requirement.variants.some((variant) => variantMatches(fields.leafName, variant))) score += 48;
    else if (requirement.variants.some((variant) => variantMatches(fields.title, variant))) score += 32;
    else if (requirement.variants.some((variant) => fields.aliases.some((alias) => variantMatches(alias, variant)))) score += 27;
    else if (requirement.variants.some((variant) => fields.keywords.some((keyword) => variantMatches(keyword, variant)))) score += 18;
  });

  const requestedYears = queryTokens.filter((token) => /^20\d{2}$/.test(token)).map(Number);
  const availableYears = new Set(resourceRangeYears(resource));
  if (requestedYears.some((year) => availableYears.has(year))) score += 60;
  const sortYear = Number(resource.sortYear || resource.yearEnd || resource.year || 0);
  if (!hasYear && sortYear) score += Math.max(0, Math.min(12, sortYear - 2020));
  if (asksForApplication && resource.type === "application") score += 80;
  if (asksForDocument && resource.type !== "application") score += 60;

  return score;
}

export function searchResourcesWithScores(resources, query, synonyms = []) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return resources.map((resource) => ({ resource, score: 0 }));
  const requirements = buildRequirements(normalizedQuery, synonyms);

  return resources
    .map((resource) => ({ resource, score: scoreResource(resource, normalizedQuery, requirements) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score
      || (b.resource.sortYear || b.resource.yearEnd || b.resource.year || 0) - (a.resource.sortYear || a.resource.yearEnd || a.resource.year || 0)
      || (a.resource.sortOrder || 999) - (b.resource.sortOrder || 999)
      || a.resource.title.localeCompare(b.resource.title, "id"));
}

export function searchResources(resources, query, synonyms = []) {
  return searchResourcesWithScores(resources, query, synonyms).map((item) => item.resource);
}

export function normalizeSearch(value) {
  return normalize(value);
}
