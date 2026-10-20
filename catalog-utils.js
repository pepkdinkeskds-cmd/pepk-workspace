export function comparePeriods(left, right, currentYear = new Date().getFullYear()) {
  const start = (r) => Number(r.yearStart || r.year || 0);
  const end = (r) => Number(r.yearEnd || r.year || start(r));
  const bucket = (r) => start(r) <= currentYear && end(r) >= currentYear && start(r) > 0 ? 0 : start(r) > currentYear ? 2 : 1;
  const difference = bucket(left) - bucket(right);
  if (difference) return difference;
  const yearDifference = bucket(left) === 2 ? start(left) - start(right) : start(right) - start(left);
  return yearDifference || String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))
    || (left.sortOrder || 999) - (right.sortOrder || 999) || left.title.localeCompare(right.title, "id");
}

export function resourceDisplayTitle(resource) {
  if (resource.kind !== "deep-folder" || !resource.path) return resource.title;
  const parts = resource.path.split(/\s*[›>]\s*/).filter(Boolean);
  return parts.slice(1).join(" · ") || resource.title;
}
