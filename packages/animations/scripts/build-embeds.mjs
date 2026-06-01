#!/usr/bin/env node
/**
 * Builds every concept into a self-contained, embeddable Motion Canvas bundle and stages
 * all runtime assets into the Astro site:
 *   site/public/animations/<slug>.js   one bundle per concept (core externalized)
 *   site/public/animations/core.js     the shared @motion-canvas/core (import-mapped)
 *   site/public/animations/player.js   the <motion-canvas-player> web component
 *   site/src/concepts.json             manifest (registry metadata + asset paths)
 *
 * Atomic: every concept is built to dist/ FIRST; site/public + the manifest are only
 * touched once all concepts have built, so a mid-run failure never leaves staged bundles
 * out of sync with the manifest.
 */
import {execSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const ANIM = path.resolve(here, '..');
const SITE = path.resolve(ANIM, '../site');
const OUT = path.join(SITE, 'public', 'animations');
const NM = path.join(ANIM, 'node_modules');
const require = createRequire(import.meta.url);

const log = (...a) => console.log('[build-embeds]', ...a);

const registry = JSON.parse(fs.readFileSync(path.join(ANIM, 'src/concepts/registry.json'), 'utf8'));
fs.mkdirSync(OUT, {recursive: true});
fs.mkdirSync(path.join(SITE, 'src'), {recursive: true});

// 1) build every concept to dist/ first — no site mutation yet — collecting failures
const built = [];
const failures = [];
for (const c of registry) {
  const outDir = path.join(ANIM, 'dist', c.slug);
  log('building', c.slug, '...');
  try {
    execSync('node ./node_modules/vite/bin/vite.js build', {
      cwd: ANIM,
      stdio: 'inherit',
      env: {...process.env, MC_EMBED: '1', MC_PROJECT: `./src/projects/${c.slug}.ts`, MC_OUTDIR: `dist/${c.slug}`},
    });
    const bundle = walk(outDir).find(f => f.endsWith('.js') && path.basename(f).startsWith(`${c.slug}-`));
    if (!bundle) throw new Error('no bundle produced');
    built.push({c, bundle});
  } catch (e) {
    failures.push(c.slug);
    console.error(`[build-embeds] ${c.slug} FAILED: ${String(e.message || e).slice(0, 160)}`);
  }
}
if (failures.length) {
  console.error(`[build-embeds] aborting — ${failures.length} concept(s) failed: ${failures.join(', ')}. site/public NOT modified.`);
  process.exit(1);
}

// 2) vendor @motion-canvas/core to a single shared ESM via the resolved esbuild (deterministic)
const esbuild = await loadEsbuild();
const coreEntry = path.join(NM, '@motion-canvas/core/lib/index.js');
log('vendoring core -> core.js');
await esbuild.build({entryPoints: [coreEntry], bundle: true, format: 'esm', outfile: path.join(OUT, 'core.js'), logLevel: 'warning'});

// 3) only now mutate site/public: copy all bundles + player, then write the manifest
const manifest = [];
for (const {c, bundle} of built) {
  fs.copyFileSync(bundle, path.join(OUT, `${c.slug}.js`));
  manifest.push({
    slug: c.slug,
    title: c.title,
    category: c.category,
    summary: c.summary,
    question: c.question,
    details: c.details ?? [],
    added: c.added ?? null,
    bundle: `/animations/${c.slug}.js`,
    poster: `/animations/${c.slug}.png`,
  });
}
fs.copyFileSync(path.join(NM, '@motion-canvas/player/dist/main.js'), path.join(OUT, 'player.js'));
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

// Resolve esbuild deterministically by Node resolution (the version in this package's tree),
// not by readdir order over .pnpm. Works whether esbuild is a direct dep or pulled via vite.
async function loadEsbuild() {
  try { const m = await import('esbuild'); return m.build ? m : m.default; } catch {}
  try { const m = await import(pathToFileURL(require.resolve('esbuild')).href); return m.build ? m : m.default; } catch {}
  // fallback: deterministic .pnpm lookup (sorted, prefer the version vite pins) — no readdir-order luck
  const pnpmDir = path.resolve(ANIM, '../../node_modules/.pnpm');
  const dirs = fs.readdirSync(pnpmDir).filter(d => d.startsWith('esbuild@')).sort();
  const pick = dirs.find(d => d.startsWith('esbuild@0.21.')) || dirs[0];
  if (!pick) throw new Error('esbuild not found — add it to devDependencies');
  const m = await import(pathToFileURL(path.join(pnpmDir, pick, 'node_modules/esbuild/lib/main.js')).href);
  return m.build ? m : m.default;
}
