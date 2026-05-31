import {defineConfig} from 'astro/config';

// Pure static site — no adapter needed. `site` builds absolute URLs for OG tags.
// Astro emits to its default `dist` (packages/site/dist); a post-build step
// (scripts/stage-dist.mjs, wired into the `build` script) then writes the Vercel
// Build Output API (.vercel/output) so Vercel serves the site directly, bypassing
// its (misconfigured) Output Directory detection.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  build: {format: 'directory'},
});
