import {defineConfig} from 'astro/config';

// Pure static site — no adapter needed. `site` builds absolute URLs for OG tags.
// Vercel's Root Directory is packages/site and its Output Directory is dist, so
// Astro's default output (packages/site/dist) is served as-is.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  build: {format: 'directory'},
  // Bind to 0.0.0.0 so the dev server is reachable over the LAN (e.g. phone/other
  // machine at http://<host-ip>:4321). Default is localhost-only.
  server: {host: true},
});
