import type {APIRoute} from "astro";
import concepts from "../../concepts.json";
import {handleStats} from "../../lib/views";
import {getViewStore} from "../../lib/redis";

export const prerender = false;

const slugs = concepts.map((c) => c.slug);

export const GET: APIRoute = async () => {
  const store = getViewStore();
  // Upstash absent in production → empty stats so the strip/badges stay hidden.
  if (!store) {
    return new Response(JSON.stringify({counts: {}, trending: []}), {status: 200, headers: {"content-type": "application/json", "cache-control": "public, max-age=60"}});
  }
  return handleStats(slugs, store, () => Date.now());
};
