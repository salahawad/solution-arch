import {defineConfig} from 'astro/config';

// Pure static site — no adapter needed. `site` builds absolute URLs for OG tags.
// Astro emits to its default `dist` (packages/site/dist); a post-build step
// (scripts/stage-dist.mjs, wired into the `build` script) then copies that output
// to the other candidate `dist` locations so Vercel finds it regardless of how
// the project's Root/Output Directory is configured.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  build: {format: 'directory'},
});
