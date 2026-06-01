import type {APIRoute} from "astro";
import {handlePresence, InMemoryPresenceStore, type PresenceStore} from "../../lib/presence";
import {getRedis, UpstashPresenceStore} from "../../lib/redis";

export const prerender = false; // on-demand serverless function

// Single in-memory fallback for local dev: the dev server is one process, so the live count
// is real there. In production getRedis() returns a client and the Upstash store is used.
const dev: PresenceStore = new InMemoryPresenceStore();

export const POST: APIRoute = async ({request}) => {
  const redis = getRedis();
  const store: PresenceStore = redis ? new UpstashPresenceStore(redis) : dev;
  return handlePresence(request, store, () => Date.now());
};
