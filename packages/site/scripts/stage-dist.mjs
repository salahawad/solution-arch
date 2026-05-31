// Post-build staging for Vercel.
//
// The build runs in packages/site and Astro outputs packages/site/dist, but
// Vercel resolves its (dashboard) Output Directory "dist" against a base we
// can't see — and it doesn't match packages/site/dist. Rather than guess the
// base, copy the built dist into every candidate <base>/dist so it lines up
// wherever Vercel looks. Paths are anchored to this file's URL
// (packages/site/scripts/), independent of the build's working directory.
import {cpSync, existsSync, rmSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const siteDist = fileURLToPath(new URL('../dist', import.meta.url)); // packages/site/dist (source)
const targets = [
  fileURLToPath(new URL('../../dist', import.meta.url)), //    packages/dist
  fileURLToPath(new URL('../../../dist', import.meta.url)), // <repo>/dist
];

if (!existsSync(siteDist) || !statSync(siteDist).isDirectory()) {
  console.error(`[stage-dist] build output not found at ${siteDist}`);
  process.exit(1);
}

for (const dir of targets) {
  rmSync(dir, {recursive: true, force: true});
  cpSync(siteDist, dir, {recursive: true});
  console.log(`[stage-dist] staged dist -> ${dir}`);
}
