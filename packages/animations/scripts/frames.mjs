#!/usr/bin/env node
/**
 * Frame grabber + early-frame auditor for concept scenes. Two modes:
 *
 *   node scripts/frames.mjs audit <ms>
 *     Render EVERY concept (from the committed manifest, using the already-staged
 *     site/public/animations/<slug>.js bundles) at <ms> and print the "body ink"
 *     (lit pixels BELOW the title band). At a small <ms> (e.g. 350) only the title
 *     should be visible, so any body ink means an element is on screen before its
 *     panel reveals — i.e. a stray-visibility bug. Requires a prior `build:embeds`
 *     so core.js / player.js / the bundles exist.
 *
 *   node scripts/frames.mjs snap <slug> <ms> <outPath>
 *     Rebuild THIS slug's embed, stage it, and screenshot the player at <ms> to
 *     <outPath>. Used to see-and-fix a single scene (early frame ~350ms = title only;
 *     settled frame ~9500ms = the full composition for overlap checks).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const ANIM = path.resolve(here, '..');
const SITE = path.resolve(ANIM, '../site');
const OUT = path.join(SITE, 'public', 'animations');
const require = createRequire(import.meta.url);

async function loadChromium() {
  try { return (require('playwright')).chromium; } catch {}
  try { return (await import('playwright')).chromium; } catch {}
  throw new Error('playwright not found');
}

const TYPES = {'.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png'};
const pageHtml = (slug) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>html,body{margin:0;background:#06080d;height:100%}.f{display:grid;place-items:center;height:100vh}
motion-canvas-player{width:432px;aspect-ratio:9/16;display:block}</style>
<script type="importmap">{"imports":{"@motion-canvas/core":"/animations/core.js"}}</script>
<script type="module" src="/animations/player.js"></script>
</head><body><div class="f">
<motion-canvas-player src="/animations/${slug}.js" auto="true" quality="1" width="1080" height="1920"></motion-canvas-player>
</div></body></html>`;

// Lit pixels BELOW the title band (top ~18%), downscaled for speed.
const BODY_INK = () => {
  const host = document.querySelector('motion-canvas-player');
  const root = host && host.shadowRoot ? host.shadowRoot : document;
  const c = root.querySelector('canvas') || (host && host.querySelector('canvas'));
  if (!c) return -1;
  const w = 180, h = 320;
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const ctx = off.getContext('2d');
  ctx.drawImage(c, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let n = 0;
  for (let i = 58 * w * 4; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 110) n++;
  return n;
};

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function buildSlug(slug) {
  execSync('node ./node_modules/vite/bin/vite.js build', {
    cwd: ANIM, stdio: 'pipe',
    env: {...process.env, MC_EMBED: '1', MC_PROJECT: `./src/projects/${slug}.ts`, MC_OUTDIR: `dist/${slug}`},
  });
  const bundle = walk(path.join(ANIM, 'dist', slug)).find(f => f.endsWith('.js') && path.basename(f).startsWith(`${slug}-`));
  if (!bundle) throw new Error('no bundle produced for ' + slug);
  fs.copyFileSync(bundle, path.join(OUT, `${slug}.js`));
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const m = url.match(/^\/page\/(.+)$/);
    if (m) { res.writeHead(200, {'content-type': 'text/html'}); return res.end(pageHtml(m[1])); }
    if (url.startsWith('/animations/')) {
      const file = path.join(OUT, url.slice('/animations/'.length));
      try { const d = fs.readFileSync(file); res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'}); return res.end(d); }
      catch { res.writeHead(404); return res.end('nf'); }
    }
    res.writeHead(404); res.end('nf');
  });
  return server;
}

const mode = process.argv[2];
const chromium = await loadChromium();
const server = startServer();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({headless: true});

if (mode === 'audit') {
  const ms = parseInt(process.argv[3] ?? '350', 10);
  const manifest = JSON.parse(fs.readFileSync(path.join(SITE, 'src', 'concepts.json'), 'utf8'));
  const rows = [];
  for (const c of manifest) {
    const page = await browser.newPage({viewport: {width: 560, height: 860}, deviceScaleFactor: 1});
    let ink = -1;
    try {
      await page.goto(`http://127.0.0.1:${port}/page/${c.slug}`, {waitUntil: 'load', timeout: 30000});
      await page.waitForTimeout(ms);
      ink = await page.evaluate(BODY_INK);
    } catch (e) { ink = -2; }
    rows.push({slug: c.slug, ink});
    await page.close();
  }
  rows.sort((a, b) => b.ink - a.ink);
  console.log(`\n[audit @${ms}ms] body ink (BELOW title band) — expect ~0 if only the title is up:`);
  for (const r of rows) {
    const flag = r.ink > 120 ? '  <-- STRAY VISIBLE' : r.ink < 0 ? '  <-- render error' : '';
    console.log(`  ${String(r.ink).padStart(6)}  ${r.slug}${flag}`);
  }
  const strays = rows.filter(r => r.ink > 120).map(r => r.slug);
  console.log(`\n[audit] ${strays.length} scene(s) with stray-visible elements: ${strays.join(', ') || '(none)'}`);
} else if (mode === 'snap') {
  const [, , , slug, msArg, outPath] = process.argv;
  const ms = parseInt(msArg, 10);
  buildSlug(slug);
  const page = await browser.newPage({viewport: {width: 560, height: 860}, deviceScaleFactor: 1});
  await page.goto(`http://127.0.0.1:${port}/page/${slug}`, {waitUntil: 'load', timeout: 30000});
  await page.waitForTimeout(ms);
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, await page.locator('motion-canvas-player').first().screenshot());
  console.log(`snap ${slug} @${ms}ms -> ${outPath}`);
} else {
  console.error('usage: frames.mjs audit <ms> | snap <slug> <ms> <outPath>');
  process.exitCode = 2;
}

await browser.close();
server.close();
