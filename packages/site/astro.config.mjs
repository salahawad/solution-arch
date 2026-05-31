import {defineConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';

// Pure static site — no adapter needed. `site` builds absolute URLs for OG tags.
//
// Vercel resolves the project's Output Directory ("dist") against the repo root
// (/vercel/path0), but the build runs in packages/site and Astro's default output
// is packages/site/dist — which Vercel never looks at. Emit to the repo-root dist
// instead so it matches. Anchored to this file's URL (packages/site/), so
// ../../dist resolves to <repo>/dist regardless of the build's working directory.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  outDir: fileURLToPath(new URL('../../dist', import.meta.url)),
  build: {format: 'directory'},
});
