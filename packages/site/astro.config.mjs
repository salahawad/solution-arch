import {defineConfig} from 'astro/config';
import {fileURLToPath} from 'node:url';

// Pure static site — no adapter needed.
// `site` builds absolute URLs for OG/social tags.
//
// The Vercel project's Root Directory is `packages`, and it serves the `dist`
// directory found there (`<repo>/packages/dist`). Astro's default output is
// `packages/site/dist`, which Vercel never looks at — so emit to `packages/dist`
// instead. Anchoring to this file's own URL (not process.cwd()) keeps the path
// correct regardless of which directory Vercel runs the build command from.
// This file lives at packages/site/, so `../dist` resolves to packages/dist.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://solution-arch.vercel.app',
  outDir: fileURLToPath(new URL('../dist', import.meta.url)),
  build: {format: 'directory'},
});
