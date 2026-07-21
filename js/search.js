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

const STOP_WORDS = new Set([
  "aku", "anda", "atau", "berkas", "bisa", "butuh", "carikan", "cari",
  "dalam", "dan", "dari", "di", "dokumen", "file", "folder", "ingin",
  "ke", "mau", "mencari", "mohon", "pada", "saya", "sebuah", "semua",
  "tahun", "tentang", "tolong", "untuk", "yang"
]);

const TYPE_HINTS = new Set(["aplikasi", "app", "portal", "sistem", "dokumen", "folder", "berkas", "file"]);

function canonicalizeQuery(query, synonyms = []) {
  let result = ` ${normalize(query)} `;
  const replacements = [];

  synonyms.forEach((item) => {
    const term = normalize(item.term);
    if (!term) return;
    const variants = [item.term, ...(Array.isArray(item.synonyms) ? item.synonyms : [])]
      .map(normalize)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    variants.forEach((variant) => replacements.push({ variant, term }));
  });

  replacements
    .sort((a, b) => b.variant.length - a.variant.length)
    .forEach(({ variant, term }) => {
      if (!containsPhrase(result.trim(), variant)) return;
      result = result.replace(` ${variant} `, ` ${term} `);
    });

  return normalize(result);
}

function prepareQuery(query, synonyms = []) {
  const original = normalize(query);
  const canonical = canonicalizeQuery(query, synonyms);
  const rawTokens = tokens(canonical);
  const years = rawTokens.filter((token) => /^20\d{2}$/.test(token)).map(Number);
  const asksForApplication = rawTokens.some((token) => ["app", "aplikasi", "portal", "sistem"].includes(token));
  const asksForDocument = rawTokens.some((token) => ["folder", "dokumen", "berkas", "file"].includes(token));
  const meaningfulTokens = rawTokens.filter((token) => !STOP_WORDS.has(token) && !TYPE_HINTS.has(token));
  return {
    original,
    canonical,
    cleaned: meaningfulTokens.join(" "),
    rawTokens,
    meaningfulTokens,
    years: [...new Set(years)],
    asksForApplication,
    asksForDocument
  };
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

function resourceIncludesYears(resource, requestedYears) {
  if (!requestedYears.length) return true;
  const available = new Set(resourceRangeYears(resource));
  return requestedYears.every((year) => available.has(year));
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

function structuralText(resource, fields = normalizedFields(resource)) {
  return normalize([
    fields.leafName,
    fields.title,
    fields.category,
    fields.workspace,
    fields.path,
    fields.parentPath,
    fields.period,
    resource.year,
    resource.yearStart,
    resource.yearEnd,
    ...resourceRangeYears(resource)
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

function baseScoredResults(resources, query, synonyms = []) {
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

function uniquePhrases(values) {
  return [...new Set(values.map(normalize).filter(Boolean))]
    .sort((a, b) => tokens(b).length - tokens(a).length || b.length - a.length);
}

function longestContainedPhrase(query, phrases) {
  return uniquePhrases(phrases).find((phrase) => containsPhrase(query, phrase)) || "";
}

function removePhrase(query, phrase) {
  if (!phrase) return normalize(query);
  return normalize(` ${normalize(query)} `.replace(` ${normalize(phrase)} `, " "));
}

function removeYears(query) {
  return tokens(query).filter((token) => !/^20\d{2}$/.test(token)).join(" ");
}

function categoryMatches(resource, context, { family = false } = {}) {
  const category = normalize(resource.category);
  if (!context) return true;
  return category === context || (family && category.startsWith(`${context} `));
}

function exactApplicationMatches(resources, queryInfo) {
  if (!queryInfo.cleaned) return [];
  return resources.filter((resource) => {
    if (resource.type !== "application") return false;
    const fields = normalizedFields(resource);
    return fields.title === queryInfo.cleaned || fields.aliases.includes(queryInfo.cleaned);
  });
}

function deriveStructuralIntent(resources, queryInfo) {
  const direct = resources.filter((resource) => resource.kind === "deep-folder");
  const documents = resources.filter((resource) => resource.type !== "application" && resource.kind !== "deep-folder");
  const contextPhrase = longestContainedPhrase(
    queryInfo.cleaned,
    [...documents.map((resource) => resource.category), ...direct.map((resource) => resource.category)]
  );
  const rawLeafPhrase = longestContainedPhrase(
    queryInfo.cleaned,
    direct.map((resource) => resource.leafName)
  );

  // A phrase is treated as a leaf intent only when that exact leaf exists in
  // the selected structural context. This prevents intermediate path words
  // such as “pergeseran” in “DPA pergeseran 2026” from being mistaken for a
  // final folder name merely because another branch has a leaf with that name.
  const leafPhrase = rawLeafPhrase && direct.some((resource) => {
    const fields = normalizedFields(resource);
    return fields.leafName === rawLeafPhrase
      && resourceIncludesYears(resource, queryInfo.years)
      && (!contextPhrase || categoryMatches(resource, contextPhrase, { family: true }));
  }) ? rawLeafPhrase : "";

  let remainder = queryInfo.cleaned;
  remainder = removePhrase(remainder, leafPhrase);
  remainder = removePhrase(remainder, contextPhrase);
  remainder = removeYears(remainder);
  const remainderTokens = tokens(remainder).filter((token) => !STOP_WORDS.has(token) && !TYPE_HINTS.has(token));

  return { leafPhrase, contextPhrase, remainderTokens };
}

function exactTokenMatchesStructural(resource, queryTokens) {
  if (!queryTokens.length) return true;
  const haystack = structuralText(resource);
  return queryTokens.every((token) => variantMatches(haystack, token));
}

function directMatchesIntent(resource, intent, queryInfo, { contextFamily = false } = {}) {
  if (resource.kind !== "deep-folder") return false;
  if (!resourceIncludesYears(resource, queryInfo.years)) return false;
  const fields = normalizedFields(resource);
  if (intent.leafPhrase && fields.leafName !== intent.leafPhrase) return false;
  if (intent.contextPhrase && !categoryMatches(resource, intent.contextPhrase, { family: contextFamily })) return false;
  return exactTokenMatchesStructural(resource, intent.remainderTokens);
}

function parentResourceMatches(resource, context, years, { family = false } = {}) {
  if (resource.kind === "deep-folder" || resource.type === "application") return false;
  if (!categoryMatches(resource, context, { family })) return false;
  return resourceIncludesYears(resource, years);
}

function exactSingleYear(resource, year) {
  return Number(resource.yearStart || resource.year || 0) === year
    && Number(resource.yearEnd || resource.year || 0) === year;
}

function scoreIntentItem(resource, queryInfo, synonyms, bonus = 0) {
  const normalizedQuery = queryInfo.cleaned || queryInfo.canonical || queryInfo.original;
  const requirements = buildRequirements(normalizedQuery, synonyms);
  return Math.max(scoreResource(resource, normalizedQuery, requirements), 1) + bonus;
}

function sortDirectItems(items, contextPhrase = "") {
  return items.slice().sort((a, b) => {
    const aExactContext = contextPhrase && normalize(a.resource.category) === contextPhrase ? 1 : 0;
    const bExactContext = contextPhrase && normalize(b.resource.category) === contextPhrase ? 1 : 0;
    return (b.resource.sortYear || 0) - (a.resource.sortYear || 0)
      || bExactContext - aExactContext
      || b.score - a.score
      || a.resource.path.localeCompare(b.resource.path, "id");
  });
}

function levenshtein(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyTokenMatch(queryToken, candidateToken) {
  if (queryToken === candidateToken) return true;
  if (queryToken.length >= 4 && candidateToken.startsWith(queryToken)) return true;
  const maxDistance = Math.max(queryToken.length, candidateToken.length) >= 8 ? 2 : 1;
  return Math.min(queryToken.length, candidateToken.length) >= 4
    && levenshtein(queryToken, candidateToken) <= maxDistance;
}

function fuzzyCoverage(resource, queryTokens) {
  const candidateTokens = tokens(structuralText(resource));
  let exact = 0;
  let fuzzy = 0;
  for (const queryToken of queryTokens) {
    if (/^20\d{2}$/.test(queryToken)) continue;
    if (candidateTokens.includes(queryToken)) {
      exact += 1;
      continue;
    }
    if (candidateTokens.some((candidate) => fuzzyTokenMatch(queryToken, candidate))) {
      fuzzy += 1;
      continue;
    }
    return null;
  }
  return { exact, fuzzy };
}

function fuzzyDirectResults(resources, queryInfo, structuralIntent, synonyms) {
  const queryTokens = queryInfo.meaningfulTokens;
  if (!queryTokens.length) return [];
  return resources
    .filter((resource) => resource.kind === "deep-folder")
    .filter((resource) => resourceIncludesYears(resource, queryInfo.years))
    .filter((resource) => !structuralIntent.contextPhrase || categoryMatches(resource, structuralIntent.contextPhrase, { family: true }))
    .map((resource) => ({ resource, coverage: fuzzyCoverage(resource, queryTokens) }))
    .filter((item) => item.coverage && item.coverage.fuzzy > 0)
    .map((item) => ({
      resource: item.resource,
      score: scoreIntentItem(item.resource, queryInfo, synonyms, 120 + item.coverage.exact * 25 - item.coverage.fuzzy * 5)
    }))
    .sort((a, b) => b.score - a.score || (b.resource.sortYear || 0) - (a.resource.sortYear || 0));
}

function guidanceForIntent(key, count, queryInfo, intent) {
  const yearLabel = queryInfo.years.length ? ` tahun ${queryInfo.years.join(", ")}` : "";
  if (key === "application-exact") return `${count} aplikasi dengan nama paling sesuai.`;
  if (key === "specific-folder") return `${count} folder langsung paling sesuai${yearLabel}; kartu induk disembunyikan karena pencarian sudah spesifik.`;
  if (key === "path-specific") return `${count} folder terdalam pada jalur yang diminta${yearLabel}; kartu induk disembunyikan.`;
  if (key === "parent-year") return `${count} hasil dalam ${intent.contextPhrase.toUpperCase()}${yearLabel}: folder induk diikuti folder terdalam.`;
  if (key === "parent") return `${count} folder induk terkait ${intent.contextPhrase.toUpperCase()}; tambahkan tahun atau nama subfolder untuk mempersempit.`;
  if (key === "fuzzy-folder") return `${count} folder langsung ditemukan melalui koreksi ejaan sederhana.`;
  return `${count} hasil paling relevan.`;
}

function resultObject(items, key, queryInfo, structuralIntent, extra = {}) {
  const decoratedItems = items.map((item) => {
    let searchRole = "";
    if (item.resource.kind === "deep-folder") searchRole = "direct";
    else if (["parent-year", "parent"].includes(key) && item.resource.type !== "application") searchRole = "parent";
    return searchRole
      ? { ...item, resource: { ...item.resource, searchRole } }
      : item;
  });

  return {
    items: decoratedItems,
    intent: {
      key,
      label: extra.label || key,
      cleanedQuery: queryInfo.cleaned,
      years: queryInfo.years,
      leafPhrase: structuralIntent.leafPhrase,
      contextPhrase: structuralIntent.contextPhrase,
      remainderTokens: structuralIntent.remainderTokens,
      directOnly: ["specific-folder", "path-specific", "fuzzy-folder"].includes(key),
      guidance: guidanceForIntent(key, decoratedItems.length, queryInfo, structuralIntent),
      ...extra
    }
  };
}

export function searchResourcesDetailed(resources, query, synonyms = []) {
  const queryInfo = prepareQuery(query, synonyms);
  if (!queryInfo.cleaned) {
    return resultObject(resources.map((resource) => ({ resource, score: 0 })), "empty", queryInfo, {
      leafPhrase: "", contextPhrase: "", remainderTokens: []
    });
  }

  const structuralIntent = deriveStructuralIntent(resources, queryInfo);
  const exactApps = exactApplicationMatches(resources, queryInfo);
  if (exactApps.length) {
    const items = exactApps.map((resource) => ({ resource, score: 1000 }));
    return resultObject(items, "application-exact", queryInfo, structuralIntent);
  }

  if (structuralIntent.leafPhrase) {
    const direct = resources
      .filter((resource) => directMatchesIntent(resource, structuralIntent, queryInfo, { contextFamily: true }))
      .map((resource) => ({ resource, score: scoreIntentItem(resource, queryInfo, synonyms, 320) }));
    if (direct.length) {
      return resultObject(sortDirectItems(direct, structuralIntent.contextPhrase), "specific-folder", queryInfo, structuralIntent);
    }
  }

  if (structuralIntent.contextPhrase && structuralIntent.remainderTokens.length) {
    const direct = resources
      .filter((resource) => directMatchesIntent(resource, structuralIntent, queryInfo, { contextFamily: false }))
      .map((resource) => ({ resource, score: scoreIntentItem(resource, queryInfo, synonyms, 240) }));
    if (direct.length) {
      return resultObject(sortDirectItems(direct, structuralIntent.contextPhrase), "path-specific", queryInfo, structuralIntent);
    }
  }

  if (structuralIntent.contextPhrase && queryInfo.years.length) {
    const parents = resources
      .filter((resource) => parentResourceMatches(resource, structuralIntent.contextPhrase, queryInfo.years, { family: false }))
      .map((resource) => ({ resource, score: scoreIntentItem(resource, queryInfo, synonyms, 300) }))
      .sort((a, b) => b.score - a.score || (b.resource.sortYear || 0) - (a.resource.sortYear || 0));

    const requestedYear = queryInfo.years.length === 1 ? queryInfo.years[0] : null;
    const expandChildren = requestedYear && parents.some((item) => exactSingleYear(item.resource, requestedYear));
    const children = expandChildren
      ? resources
        .filter((resource) => resource.kind === "deep-folder")
        .filter((resource) => categoryMatches(resource, structuralIntent.contextPhrase, { family: false }))
        .filter((resource) => resourceIncludesYears(resource, queryInfo.years))
        .map((resource) => ({ resource, score: scoreIntentItem(resource, queryInfo, synonyms, 160) }))
        .sort((a, b) => b.score - a.score || a.resource.path.localeCompare(b.resource.path, "id"))
      : [];

    if (parents.length || children.length) {
      return resultObject([...parents, ...children], "parent-year", queryInfo, structuralIntent, { expandedChildren: Boolean(children.length) });
    }
  }

  if (structuralIntent.contextPhrase && !queryInfo.years.length && !structuralIntent.remainderTokens.length) {
    const parents = resources
      .filter((resource) => parentResourceMatches(resource, structuralIntent.contextPhrase, [], { family: true }))
      .map((resource) => ({ resource, score: scoreIntentItem(resource, queryInfo, synonyms, 220) }))
      .sort((a, b) => b.score - a.score
        || (b.resource.sortYear || 0) - (a.resource.sortYear || 0)
        || a.resource.title.localeCompare(b.resource.title, "id"));
    if (parents.length) return resultObject(parents, "parent", queryInfo, structuralIntent);
  }

  const strict = baseScoredResults(resources, queryInfo.cleaned, synonyms)
    .filter((item) => resourceIncludesYears(item.resource, queryInfo.years));
  if (strict.length) return resultObject(strict, "generic", queryInfo, structuralIntent);

  const fuzzy = fuzzyDirectResults(resources, queryInfo, structuralIntent, synonyms);
  if (fuzzy.length) return resultObject(fuzzy, "fuzzy-folder", queryInfo, structuralIntent);

  return resultObject([], "none", queryInfo, structuralIntent, { guidance: "Tidak ada folder yang cocok." });
}

export function searchResourcesWithScores(resources, query, synonyms = []) {
  return searchResourcesDetailed(resources, query, synonyms).items;
}

export function searchResources(resources, query, synonyms = []) {
  return searchResourcesWithScores(resources, query, synonyms).map((item) => item.resource);
}

export function analyzeSearchIntent(resources, query, synonyms = []) {
  return searchResourcesDetailed(resources, query, synonyms).intent;
}

export function normalizeSearch(value) {
  return normalize(value);
}
