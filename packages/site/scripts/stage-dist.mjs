// Post-build staging for Vercel — emits the Build Output API (v3) structure.
//
// Background: this project's Vercel "Output Directory" detection fails with
// `No Output Directory named "dist" found` no matter where the built site is
// placed (we verified dist present at the repo root, packages/, AND
// packages/site/ and it still failed). The relevant project setting can't be
// changed from code.
//
// The fix: produce a `.vercel/output` directory. When `vercel build` finds one,
// it uses the Build Output API directly and SKIPS the output-directory check
// entirely. For a fully static site that means:
//   .vercel/output/config.json   -> {"version": 3}
//   .vercel/output/static/<site> -> the built files
//
// We can't be 100% sure which directory Vercel treats as the project root
// (path0), so we write `.vercel/output` at every candidate root: the repo root,
// packages/, and packages/site/. The build artifacts are also left in
// packages/site/dist (Astro's default) as a plain fallback.
import {cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// scripts/ lives at packages/site/scripts/, so this resolves to packages/site/dist:
const siteDist = fileURLToPath(new URL('../dist', import.meta.url));

// Candidate project roots, relative to packages/site/scripts/:
const roots = [
  fileURLToPath(new URL('../', import.meta.url)), //        packages/site
  fileURLToPath(new URL('../../', import.meta.url)), //     packages
  fileURLToPath(new URL('../../../', import.meta.url)), //  repo root
];

if (!existsSync(siteDist) || !statSync(siteDist).isDirectory()) {
  console.error(`[stage-dist] build output not found at ${siteDist}`);
  process.exit(1);
}

for (const root of roots) {
  const out = path.join(root, '.vercel', 'output');
  rmSync(out, {recursive: true, force: true}); // drop any stale output
  mkdirSync(out, {recursive: true});
  // Build Output API v3: a bare version marker is all a static site needs.
  writeFileSync(path.join(out, 'config.json'), JSON.stringify({version: 3}) + '\n');
  cpSync(siteDist, path.join(out, 'static'), {recursive: true});
  console.log(`[stage-dist] wrote Build Output API -> ${out}`);
}
