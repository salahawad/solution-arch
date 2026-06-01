// The ONLY module that imports @upstash/redis. Exposes a shared client (null when env is
// absent) plus Upstash-backed implementations of the PresenceStore and ViewStore interfaces.
import {Redis} from "@upstash/redis";
import type {PresenceStore} from "./presence";
import {type ViewStore, viewKey, weekKey} from "./views";

let client: Redis | null | undefined; // undefined = unresolved; null = unconfigured

/** Shared Upstash client, or null when env is absent (callers degrade gracefully). */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({url, token}) : null;
  return client;
}

const PRESENCE_KEY = "presence";

/** Upstash-backed PresenceStore: a sorted set scored by last-seen ms. */
export class UpstashPresenceStore implements PresenceStore {
  constructor(private readonly redis: Redis) {}
  async recordAndCount(id: string, now: number, windowMs: number): Promise<number> {
    const cutoff = now - windowMs;
    const tx = this.redis.multi();
    tx.zadd(PRESENCE_KEY, {score: now, member: id});
    tx.zremrangebyscore(PRESENCE_KEY, 0, cutoff);
    tx.zcard(PRESENCE_KEY);
    tx.expire(PRESENCE_KEY, Math.ceil(windowMs / 1000) + 5);
    const res = (await tx.exec()) as [unknown, unknown, number, unknown];
    return res[2];
  }
}

/** Upstash-backed ViewStore: per-slug counters + a weekly trending sorted set. */
export class UpstashViewStore implements ViewStore {
  constructor(private readonly redis: Redis) {}
  async increment(slug: string, now: number): Promise<number> {
    const tx = this.redis.multi();
    tx.incr(viewKey(slug));
    tx.zincrby(weekKey(now), 1, slug);
    const res = (await tx.exec()) as [number, unknown];
    return res[0];
  }
  async counts(slugs: string[]): Promise<Record<string, number>> {
    if (!slugs.length) return {};
    const vals = (await this.redis.mget<(number | null)[]>(...slugs.map(viewKey))) ?? [];
    const out: Record<string, number> = {};
    slugs.forEach((s, i) => {
      const v = vals[i];
      if (typeof v === "number" && v > 0) out[s] = v;
    });
    return out;
  }
  async trending(now: number, n: number): Promise<string[]> {
    const res = await this.redis.zrange<string[]>(weekKey(now), 0, n - 1, {rev: true});
    return res ?? [];
  }
}
