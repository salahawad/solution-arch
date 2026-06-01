// Thin, defensive localStorage wrapper for habit state. Every access is guarded so
// private-mode / disabled storage / corrupt data degrades to EMPTY rather than throwing.

export interface Progress {
  seen: string[];
  lastVisit: number | null;
  version: number;
}

const KEY = "sa.progress";
export const EMPTY: Progress = {seen: [], lastVisit: null, version: 1};

export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {...EMPTY};
    const p = JSON.parse(raw);
    return {
      seen: Array.isArray(p.seen) ? p.seen.filter((s: unknown) => typeof s === "string") : [],
      lastVisit: typeof p.lastVisit === "number" ? p.lastVisit : null,
      version: 1,
    };
  } catch {
    return {...EMPTY};
  }
}

export function writeProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — habit features silently no-op */
  }
}
