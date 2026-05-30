import {defineConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';

// Pure static site — no adapter needed.
// `site` builds absolute URLs for OG/social tags.
//
// Vercel's project Root Directory is the repo root, and it serves a `dist`
// directory there (its configured Output Directory). Astro's default output
// (packages/site/dist) is the wrong place, so point `outDir` at the repo-root
// `dist`. Anchoring to this file's own URL (not process.cwd()) keeps it correct
// no matter which directory Vercel runs the build command from.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  outDir: fileURLToPath(new URL('../../dist', import.meta.url)),
  build: {format: 'directory'},
});
