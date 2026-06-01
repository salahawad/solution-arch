import type {APIRoute} from "astro";
import concepts from "../../../concepts.json";
import {handleView, memViewStore, type ViewStore} from "../../../lib/views";
import {getRedis, UpstashViewStore} from "../../../lib/redis";

export const prerender = false; // on-demand serverless function

const slugs = concepts.map((c) => c.slug);

export const POST: APIRoute = async ({params}) => {
  const redis = getRedis();
  const store: ViewStore = redis ? new UpstashViewStore(redis) : memViewStore;
  return handleView(params.slug ?? "", slugs, store, () => Date.now());
};
