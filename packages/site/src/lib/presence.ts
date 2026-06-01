/**
 * Site-wide live-presence logic. Dependency-free and unit-tested.
 * The Upstash-backed store and Vercel edge wiring live in `api/presence.ts`.
 */

export interface PresenceStore {
  /**
   * Atomically: record `id` as last-seen at `now`, evict members last seen at
   * or before `now - windowMs`, and return the distinct count still present.
   * The caller's own beat is added first, so the result is always >= 1.
   */
  recordAndCount(id: string, now: number, windowMs: number): Promise<number>;
}

/** In-memory store for local dev and tests — no network required. */
export class InMemoryPresenceStore implements PresenceStore {
  private seen = new Map<string, number>();

  async recordAndCount(id: string, now: number, windowMs: number): Promise<number> {
    this.seen.set(id, now);
    const cutoff = now - windowMs;
    for (const [key, lastSeen] of this.seen) {
      if (lastSeen <= cutoff) this.seen.delete(key);
    }
    return this.seen.size;
  }
}

/** A visitor id is a non-empty string of at most 64 chars (a UUID is 36). */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 64;
}

/** JSON response helper; presence is always uncached. */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Default "still online" window: a visitor counts if seen within 60s. */
export const PRESENCE_WINDOW_MS = 60_000;

/**
 * Handle a presence heartbeat. Pure over an injected store + clock so it is
 * testable without Upstash. POST { id } -> 200 { count }.
 */
export async function handlePresence(
  request: Request,
  store: PresenceStore,
  now: () => number,
  windowMs: number = PRESENCE_WINDOW_MS,
): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const id = (body as { id?: unknown } | null)?.id;
  if (!isValidId(id)) {
    return json({ error: 'invalid id' }, 400);
  }

  try {
    const count = await store.recordAndCount(id, now(), windowMs);
    return json({ count });
  } catch {
    return json({ error: 'store unavailable' }, 503);
  }
}
