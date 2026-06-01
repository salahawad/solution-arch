import type {APIRoute} from "astro";
import concepts from "../../../concepts.json";
import {handleView} from "../../../lib/views";
import {getViewStore} from "../../../lib/redis";

export const prerender = false; // on-demand serverless function

const slugs = concepts.map((c) => c.slug);

export const POST: APIRoute = async ({params}) => {
  const store = getViewStore();
  // Upstash absent in production → don't fabricate a per-instance count; the UI hides.
  if (!store) {
    return new Response(JSON.stringify({count: null}), {status: 200, headers: {"content-type": "application/json", "cache-control": "no-store"}});
  }
  return handleView(params.slug ?? "", slugs, store, () => Date.now());
};
