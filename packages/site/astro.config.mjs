import {defineConfig} from 'astro/config';

// Pure static site — no adapter needed. `site` builds absolute URLs for OG tags.
// Vercel's Root Directory is packages/site and its Output Directory is dist, so
// Astro's default output (packages/site/dist) is served as-is.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  build: {format: 'directory'},
});
