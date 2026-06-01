import type {APIRoute} from "astro";
import concepts from "../../concepts.json";
import {handleStats, memViewStore, type ViewStore} from "../../lib/views";
import {getRedis, UpstashViewStore} from "../../lib/redis";

export const prerender = false;

const slugs = concepts.map((c) => c.slug);

export const GET: APIRoute = async () => {
  const redis = getRedis();
  const store: ViewStore = redis ? new UpstashViewStore(redis) : memViewStore;
  return handleStats(slugs, store, () => Date.now());
};
