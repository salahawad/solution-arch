import type {APIRoute} from "astro";
import {handlePresence, json} from "../../lib/presence";
import {getPresenceStore} from "../../lib/redis";

export const prerender = false; // on-demand serverless function

export const POST: APIRoute = async ({request}) => {
  const store = getPresenceStore();
  // Upstash absent in production → 503 so the badge stays hidden (it hides on !res.ok).
  if (!store) return json({error: "unconfigured"}, 503);
  return handlePresence(request, store, () => Date.now());
};
