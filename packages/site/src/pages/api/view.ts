import type {APIRoute} from "astro";
import concepts from "../../concepts.json";
import {handleView} from "../../lib/views";
import {getViewStore} from "../../lib/redis";

export const prerender = false; // on-demand serverless function

const slugs = concepts.map((c) => c.slug);

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {status, headers: {"content-type": "application/json", "cache-control": "no-store"}});

// POST /api/view  { slug } -> { count }. Mirrors /api/presence (static path, JSON
// body) rather than a /api/view/<slug> path segment, which a firewall/WAF rule was
// rejecting with 403 while the identically-shaped presence POST was allowed through.
export const POST: APIRoute = async ({request}) => {
  const store = getViewStore();
  // Upstash absent in production → don't fabricate a per-instance count; the UI hides.
  if (!store) return json({count: null}, 200);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({error: "invalid json"}, 400);
  }
  const slug = (body as {slug?: unknown} | null)?.slug;
  return handleView(typeof slug === "string" ? slug : "", slugs, store, () => Date.now());
};
