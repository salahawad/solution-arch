#!/usr/bin/env node
/**
 * Generates a poster PNG per concept by loading its live embed in a headless browser and
 * screenshotting the rendered canvas. Reuses the exact same import-map + player setup the
 * site uses, so this doubles as an end-to-end check that every bundle actually runs.
 *   site/public/animations/<slug>.png
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ANIM = path.resolve(here, '..');
const SITE = path.resolve(ANIM, '../site');
const OUT = path.join(SITE, 'public', 'animations');

// A built poster must actually render content. Below this lit-pixel count the frame is
// treated as blank (the embed errored or never revealed itself) and the concept FAILS.
const MIN_INK = parseInt(process.env.SWEEP_MIN_INK ?? '1000', 10);

// Each animation builds up, holds its settled final state, then the player loops. We sweep a
// window and keep the LATEST "fully built" frame — the last sample whose lit-pixel count is
// within 10% of the peak. "Fully built" (near-peak ink) skips mid-build and looped-partial
// frames; "latest" means animated counters have reached their final values. Robust to looping.
const SWEEP_FROM = parseInt(process.env.SWEEP_FROM ?? '6000', 10);
const SWEEP_TO = parseInt(process.env.SWEEP_TO ?? '18000', 10);
const SWEEP_STEP = parseInt(process.env.SWEEP_STEP ?? '500', 10);

// Counts non-background pixels in the player's (shadow-DOM) canvas, downscaled for speed.
const INK = () => {
  const host = document.querySelector('motion-canvas-player');
  const root = host && host.shadowRoot ? host.shadowRoot : document;
  const c = root.querySelector('canvas') || (host && host.querySelector('canvas'));
  if (!c) return 0;
  const w = 180, h = 320;
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const ctx = off.getContext('2d');
  ctx.drawImage(c, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let n = 0;
  // Measure only the BODY (skip the top ~18% title/subtitle band). Otherwise a looped
  // title-only frame — bright bold heading, empty diagram — can out-ink a real but sparse
  // diagram (thin ring, dashed edges, small dots) and get picked as the poster.
  for (let i = 58 * w * 4; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 110) n++;
  return n;
};

const manifest = JSON.parse(fs.readFileSync(path.join(SITE, 'src', 'concepts.json'), 'utf8'));

// Resolve Playwright without a hardcoded path: prefer the declared dependency, then any
// locally cached install (e.g. from `npx playwright`). Declared in devDependencies for CI.
async function loadPlaywright() {
  const {createRequire} = await import('node:module');
  const os = await import('node:os');
  const req = createRequire(import.meta.url);
  try { return req('playwright'); } catch {}
  try { return await import('playwright'); } catch {}
  const npx = path.join(os.homedir(), '.npm', '_npx');
  if (fs.existsSync(npx)) {
    for (const d of fs.readdirSync(npx)) {
      const p = path.join(npx, d, 'node_modules', 'playwright');
      if (fs.existsSync(p)) { try { return req(p); } catch {} }
    }
  }
  throw new Error('Playwright not found. Add it to devDependencies (pnpm add -D playwright) and run `pnpm exec playwright install chromium`.');
}
const {chromium} = await loadPlaywright();

const TYPES = {'.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png'};
const page1 = (slug) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>html,body{margin:0;background:#06080d;height:100%}.f{display:grid;place-items:center;height:100vh}
motion-canvas-player{width:432px;aspect-ratio:9/16;display:block}</style>
<script type="importmap">{"imports":{"@motion-canvas/core":"/animations/core.js"}}</script>
<script type="module" src="/animations/player.js"></script>
</head><body><div class="f">
<motion-canvas-player src="/animations/${slug}.js" auto="true" quality="1" width="1080" height="1920"></motion-canvas-player>
</div></body></html>`;

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const m = url.match(/^\/page\/(.+)$/);
  if (m) { res.writeHead(200, {'content-type': 'text/html'}); return res.end(page1(m[1])); }
  if (url.startsWith('/animations/')) {
    const file = path.join(OUT, url.slice('/animations/'.length));
    try { const d = fs.readFileSync(file); res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'}); return res.end(d); }
    catch { res.writeHead(404); return res.end('nf'); }
  }
  res.writeHead(404); res.end('nf');
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({headless: true});
const benign = /reading 'size'|reading 'configure'/; // known no-op teardown errors in the player
const failed = [];
let ok = 0;
for (const c of manifest) {
  const page = await browser.newPage({viewport: {width: 560, height: 860}, deviceScaleFactor: 1});
  const errs = [];
  page.on('pageerror', e => { if (!benign.test(e.message)) errs.push(e.message); });
  let best = {ink: -1, buf: null, t: 0};
  let reason = '';
  try {
    await page.goto(`http://127.0.0.1:${port}/page/${c.slug}`, {waitUntil: 'load', timeout: 30000});
    const el = page.locator('motion-canvas-player').first();
    const frames = [];
    let prev = 0, maxInk = 0;
    for (let t = SWEEP_FROM; t <= SWEEP_TO; t += SWEEP_STEP) {
      await page.waitForTimeout(t - prev); prev = t;
      const ink = await page.evaluate(INK);
      if (ink > maxInk) maxInk = ink;
      if (ink > MIN_INK) frames.push({t, ink, buf: await el.screenshot()});
    }
    if (frames.length) {
      // latest frame within 10% of peak ink = the most settled fully-built frame
      const built = frames.filter(f => f.ink >= maxInk * 0.9);
      best = built.length ? built[built.length - 1] : frames.reduce((a, b) => (b.ink > a.ink ? b : a));
    }
    if (!best.buf) reason = 'no content frame captured (blank)';
    else if (best.ink < MIN_INK) reason = `blank/near-blank frame (ink ${best.ink} < ${MIN_INK})`;
    else if (errs.length) reason = `page error: ${errs.slice(0, 2).join('; ')}`;
  } catch (e) {
    reason = `crashed: ${String(e).slice(0, 120)}`;
  }
  if (!reason && best.buf) {
    fs.writeFileSync(path.join(OUT, `${c.slug}.png`), best.buf); // single write of the best frame
    console.log(`[posters] ${c.slug}.png ✓ @${best.t}ms (ink ${best.ink})`);
    ok++;
  } else {
    console.error(`[posters] ${c.slug} ✗ FAILED — ${reason}`);
    failed.push(c.slug);
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`[posters] ${ok}/${manifest.length} posters generated${failed.length ? `, FAILED: ${failed.join(', ')}` : ''}`);
if (failed.length) process.exit(1);
