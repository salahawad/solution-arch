// Pure habit-state logic. No DOM, no localStorage — so it unit-tests under Vitest's
// default (node) environment and is reused verbatim by the browser bundle.

/** FNV-1a hash of a string → unsigned 32-bit int. Deterministic. */
export function hashDate(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic daily pick: same date → same slug for everyone. "" if no slugs. */
export function conceptOfTheDay(slugs: string[], dateStr: string): string {
  if (slugs.length === 0) return "";
  return slugs[hashDate(dateStr) % slugs.length];
}

/** Slugs added strictly after lastVisit. Empty on first visit (lastVisit == null). */
export function newSlugs(concepts: {slug: string; added: string}[], lastVisit: number | null): string[] {
  if (lastVisit == null) return [];
  return concepts
    .filter((c) => c.added && Date.parse(c.added) > lastVisit)
    .map((c) => c.slug);
}

/** How many seen slugs still exist in the library (guards against stale slugs). */
export function exploredCount(seen: string[], allSlugs: string[]): number {
  const all = new Set(allSlugs);
  return seen.filter((s) => all.has(s)).length;
}

/** Add a slug to the seen list, deduped. Returns a new array. */
export function addSeen(seen: string[], slug: string): string[] {
  return seen.includes(slug) ? seen : [...seen, slug];
}
