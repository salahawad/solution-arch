#!/usr/bin/env node
/**
 * Builds every concept into a self-contained, embeddable Motion Canvas bundle and stages
 * all runtime assets into the Astro site:
 *   site/public/animations/<slug>.js   one bundle per concept (core externalized)
 *   site/public/animations/core.js     the shared @motion-canvas/core (import-mapped)
 *   site/public/animations/player.js   the <motion-canvas-player> web component
 *   site/src/concepts.json             manifest (registry metadata + asset paths)
 */
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const ANIM = path.resolve(here, '..');
const SITE = path.resolve(ANIM, '../site');
const OUT = path.join(SITE, 'public', 'animations');
const NM = path.join(ANIM, 'node_modules');

const log = (...a) => console.log('[build-embeds]', ...a);

const registry = JSON.parse(fs.readFileSync(path.join(ANIM, 'src/concepts/registry.json'), 'utf8'));
fs.mkdirSync(OUT, {recursive: true});
fs.mkdirSync(path.join(SITE, 'src'), {recursive: true});

// 1) build one embeddable bundle per concept
const manifest = [];
for (const c of registry) {
  const outDir = path.join(ANIM, 'dist', c.slug);
  log('building', c.slug, '...');
  execSync('node ./node_modules/vite/bin/vite.js build', {
    cwd: ANIM,
    stdio: 'inherit',
    env: {...process.env, MC_EMBED: '1', MC_PROJECT: `./src/projects/${c.slug}.ts`, MC_OUTDIR: `dist/${c.slug}`},
  });
  const bundle = walk(outDir).find(f => f.endsWith('.js') && path.basename(f).startsWith(`${c.slug}-`));
  if (!bundle) throw new Error(`no bundle produced for ${c.slug}`);
  fs.copyFileSync(bundle, path.join(OUT, `${c.slug}.js`));
  manifest.push({
    slug: c.slug,
    title: c.title,
    category: c.category,
    summary: c.summary,
    question: c.question,
    bundle: `/animations/${c.slug}.js`,
    poster: `/animations/${c.slug}.png`,
  });
}

// 2) vendor @motion-canvas/core to a single shared ESM (import-mapped on the site)
const esbuildBin = findEsbuild();
const coreEntry = path.join(NM, '@motion-canvas/core/lib/index.js');
log('vendoring core ->', 'core.js');
execSync(`"${esbuildBin}" "${coreEntry}" --bundle --format=esm --outfile="${path.join(OUT, 'core.js')}" --log-level=warning`, {stdio: 'inherit'});

// 3) copy the player web component
fs.copyFileSync(path.join(NM, '@motion-canvas/player/dist/main.js'), path.join(OUT, 'player.js'));
log('copied player.js');

// 4) write the manifest the site builds from
fs.writeFileSync(path.join(SITE, 'src', 'concepts.json'), JSON.stringify(manifest, null, 2));
log(`wrote manifest with ${manifest.length} concepts -> site/src/concepts.json`);
log('done.');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function findEsbuild() {
  const direct = path.join(NM, '.bin', 'esbuild');
  if (fs.existsSync(direct)) return direct;
  const pnpmDir = path.resolve(ANIM, '../../node_modules/.pnpm');
  const hit = fs.readdirSync(pnpmDir).find(d => d.startsWith('esbuild@'));
  if (hit) {
    const bin = path.join(pnpmDir, hit, 'node_modules/esbuild/bin/esbuild');
    if (fs.existsSync(bin)) return bin;
  }
  throw new Error('esbuild binary not found (run `pnpm rebuild esbuild`)');
}
