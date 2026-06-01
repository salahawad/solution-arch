import {defineConfig} from 'astro/config';
import vercel from '@astrojs/vercel';

// Output stays static (default): every page prerenders. Only the /api/* routes opt out
// via `export const prerender = false`, so they run on-demand as Vercel functions and can
// reach Upstash Redis. The adapter emits to .vercel/output (Build Output API).
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  adapter: vercel(),
  build: {format: 'directory'},
  // Bind to 0.0.0.0 so the dev server is reachable over the LAN (e.g. phone/other
  // machine at http://<host-ip>:4321). Default is localhost-only.
  server: {host: true},
});
