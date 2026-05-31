import {defineConfig} from 'astro/config';

// Pure static site — Vercel auto-detects Astro and serves dist/. No adapter needed.
// `site` is used to build absolute URLs for OG/social tags.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  build: {format: 'directory'},
});
