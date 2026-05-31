// Post-build staging for Vercel.
//
// Astro builds the site to packages/site/dist. This project's Vercel "Root
// Directory" / "Output Directory" settings don't line up with that path, and we
// can't change them from code — so every deploy failed with
// `No Output Directory named "dist" found`, even though the build itself was fine.
//
// Rather than guess the one correct location, copy the built site into every
// plausible `<root>/dist` directory: the repo root, the packages/ dir, and (left
// in place) packages/site. Whichever directory Vercel resolves as the project
// root, it will find a populated `dist` there. Paths are anchored to this file's
// URL, so the script is independent of the working directory Vercel runs it from.
import {cpSync, existsSync, rmSync, statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// scripts/ lives at packages/site/scripts/, so the URLs below resolve to:
const siteDist = fileURLToPath(new URL('../dist', import.meta.url)); // packages/site/dist (source)
const targets = [
  fileURLToPath(new URL('../../dist', import.meta.url)), //         packages/dist
  fileURLToPath(new URL('../../../dist', import.meta.url)), //      <repo>/dist
];

if (!existsSync(siteDist) || !statSync(siteDist).isDirectory()) {
  console.error(`[stage-dist] build output not found at ${siteDist}`);
  process.exit(1);
}

for (const dir of targets) {
  rmSync(dir, {recursive: true, force: true}); // avoid mixing in a stale copy
  cpSync(siteDist, dir, {recursive: true});
  console.log(`[stage-dist] staged dist -> ${dir}`);
}
