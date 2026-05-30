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
const PW = '/home/sawad/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const POSTER_AT = parseInt(process.env.POSTER_AT ?? '5600', 10);

const manifest = JSON.parse(fs.readFileSync(path.join(SITE, 'src', 'concepts.json'), 'utf8'));
const {chromium} = await import(PW).then(m => m.default);

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
let ok = 0;
for (const c of manifest) {
  const page = await browser.newPage({viewport: {width: 560, height: 860}, deviceScaleFactor: 1});
  const errs = [];
  page.on('pageerror', e => { if (!/reading 'size'/.test(e.message)) errs.push(e.message); });
  await page.goto(`http://127.0.0.1:${port}/page/${c.slug}`, {waitUntil: 'load', timeout: 30000});
  await page.waitForTimeout(POSTER_AT);
  const el = page.locator('motion-canvas-player').first();
  try {
    await el.screenshot({path: path.join(OUT, `${c.slug}.png`)});
    console.log(`[posters] ${c.slug}.png ✓${errs.length ? '  (errs: ' + errs.slice(0, 2).join('; ') + ')' : ''}`);
    ok++;
  } catch (e) {
    console.log(`[posters] ${c.slug} FAILED: ${String(e).slice(0, 120)}`);
  }
  await page.close();
}
console.log(`[posters] ${ok}/${manifest.length} posters generated`);
await browser.close();
server.close();
