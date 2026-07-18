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

function buildRequirements(query, synonyms = []) {
  let remaining = ` ${normalize(query)} `;
  const requirements = [];

  const entries = synonyms
    .map((item) => [item.term, ...(Array.isArray(item.synonyms) ? item.synonyms : [])].map(normalize).filter(Boolean))
    .filter((variants) => variants.length)
    .sort((a, b) => Math.max(...b.map((v) => v.length)) - Math.max(...a.map((v) => v.length)));

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

function searchableText(resource) {
  return normalize([
    resource.title,
    resource.description,
    resource.workspaceTitle,
    resource.category,
    resource.year,
    ...(resource.keywords || []),
    ...(resource.aliases || []),
    ...(resource.subfolders || [])
  ].join(" "));
}

export function searchResources(resources, query, synonyms = []) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return resources.slice();

  const requirements = buildRequirements(normalizedQuery, synonyms);

  return resources
    .map((resource) => {
      const haystack = searchableText(resource);
      const title = normalize(resource.title);
      const category = normalize(resource.category);

      const allMatched = requirements.every((requirement) =>
        requirement.variants.some((variant) => containsPhrase(haystack, variant))
      );

      if (!allMatched) return { resource, score: 0 };

      let score = requirements.length * 20;
      if (title === normalizedQuery) score += 120;
      if (title.startsWith(normalizedQuery)) score += 70;
      if (containsPhrase(title, normalizedQuery)) score += 50;
      if (category === normalizedQuery) score += 55;
      if (containsPhrase(haystack, normalizedQuery)) score += 35;
      if (String(resource.year) && tokens(normalizedQuery).includes(String(resource.year))) score += 25;

      return { resource, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.resource.year - a.resource.year || a.resource.title.localeCompare(b.resource.title, "id"))
    .map((item) => item.resource);
}

export function normalizeSearch(value) {
  return normalize(value);
}
