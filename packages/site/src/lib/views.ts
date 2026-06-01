// Pure, dependency-free view-count + trending logic and HTTP handlers. Mirrors the
// presence.ts pattern: routes inject an Upstash-backed ViewStore; tests inject the
// in-memory one. No @upstash/redis or DOM imports here.

export interface ViewStore {
  /** Record one view of `slug` at `now` (ms); return the new all-time count. */
  increment(slug: string, now: number): Promise<number>;
  /** All-time counts for the given slugs (zero/missing omitted). */
  counts(slugs: string[]): Promise<Record<string, number>>;
  /** Up to `n` slugs trending in the current week of `now`, most-viewed first. */
  trending(now: number, n: number): Promise<string[]>;
}

/** Redis key for a concept's all-time view counter. */
export function viewKey(slug: string): string {
  return `view:${slug}`;
}

/** ISO-week key for the trending sorted set, e.g. "trending:2026-W23". `now` is ms. */
export function weekKey(now: number): string {
  const d = new Date(now);
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // ISO: Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // shift to the week's Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `trending:${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Compact human count: 950 -> "950", 1234 -> "1.2k", 1500000 -> "1.5m". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "");
    if (k !== "1000") return k + "k"; // 999_500..999_999 round to "1000k" → roll over to "1m"
  }
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
}

/** Guard: only known slugs may be written (prevents arbitrary Redis key creation). */
export function isKnownSlug(slug: string, slugs: string[]): boolean {
  return slugs.includes(slug);
}

/** In-memory ViewStore for local dev + tests — no network required. */
export class InMemoryViewStore implements ViewStore {
  private total = new Map<string, number>();
  private weeks = new Map<string, Map<string, number>>();
  async increment(slug: string, now: number): Promise<number> {
    const n = (this.total.get(slug) ?? 0) + 1;
    this.total.set(slug, n);
    const wk = weekKey(now);
    const w = this.weeks.get(wk) ?? new Map<string, number>();
    w.set(slug, (w.get(slug) ?? 0) + 1);
    this.weeks.set(wk, w);
    return n;
  }
  async counts(slugs: string[]): Promise<Record<string, number>> {
    const out: Record<string, number> = {};
    for (const s of slugs) {
      const v = this.total.get(s);
      if (v && v > 0) out[s] = v;
    }
    return out;
  }
  async trending(now: number, n: number): Promise<string[]> {
    const w = this.weeks.get(weekKey(now));
    if (!w) return [];
    return [...w.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([s]) => s);
  }
}

const TRENDING_N = 5;

function json(data: unknown, status: number, maxAge: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store",
    },
  });
}

/** POST /api/view/[slug]: validate slug, record a view, return { count }. */
export async function handleView(slug: string, slugs: string[], store: ViewStore, now: () => number): Promise<Response> {
  if (!isKnownSlug(slug, slugs)) return json({error: "unknown slug"}, 404, 0);
  try {
    const count = await store.increment(slug, now());
    return json({count}, 200, 0);
  } catch {
    return json({count: null}, 200, 0);
  }
}

/** GET /api/stats: return { counts, trending } for the homepage. */
export async function handleStats(slugs: string[], store: ViewStore, now: () => number): Promise<Response> {
  try {
    const [counts, trending] = await Promise.all([store.counts(slugs), store.trending(now(), TRENDING_N)]);
    return json({counts, trending}, 200, 60);
  } catch {
    return json({counts: {}, trending: []}, 200, 60);
  }
}
