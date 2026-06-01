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
