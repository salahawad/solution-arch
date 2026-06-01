import { Redis } from '@upstash/redis';
import { handlePresence, type PresenceStore } from '../src/lib/presence';

export const config = { runtime: 'edge' };

const KEY = 'presence:site';

// One atomic round-trip: add this beat, evict stale members, return the count.
const SCRIPT = `
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, tonumber(ARGV[1]) - tonumber(ARGV[2]))
return redis.call('ZCARD', KEYS[1])
`;

class UpstashPresenceStore implements PresenceStore {
  constructor(private redis: Redis) {}

  async recordAndCount(id: string, now: number, windowMs: number): Promise<number> {
    const count = await this.redis.eval(SCRIPT, [KEY], [String(now), String(windowMs), id]);
    return Number(count);
  }
}

let store: PresenceStore | null = null;
function getStore(): PresenceStore {
  // Reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN from the environment.
  if (!store) store = new UpstashPresenceStore(Redis.fromEnv());
  return store;
}

export default function handler(request: Request): Promise<Response> {
  return handlePresence(request, getStore(), () => Date.now());
}
