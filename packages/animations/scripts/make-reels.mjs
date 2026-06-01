#!/usr/bin/env node
/**
 * Renders each concept to a branded 9:16 MP4 + an Instagram caption, for the author to post.
 * Output (gitignored): packages/animations/reels/<slug>.mp4 and reels/captions.json
 *
 *   node scripts/make-reels.mjs            # render every concept
 *   node scripts/make-reels.mjs <slug>     # render one concept (verify loop)
 *
 * Render path: the frozen Motion Canvas 3.17 stack exposes no headless exporter, so we capture
 * frames from the LIVE player in headless Chromium and stitch them with ffmpeg, bookended by
 * branded intro/outro cards. The asset server + player page + ink probe below MIRROR
 * make-posters.mjs / frames.mjs (copied, not imported). Real-time screenshot sampling is
 * intentionally lossy (timing drifts a little); good enough for short social clips.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ANIM = path.resolve(here, '..');
const SITE = path.resolve(ANIM, '../site');
const OUT = path.join(SITE, 'public', 'animations'); // built bundles + core.js + player.js
const REELS = path.join(ANIM, 'reels');

const FPS = parseInt(process.env.REEL_FPS ?? '24', 10);
const BODY_MS = parseInt(process.env.REEL_BODY_MS ?? '12000', 10); // play-through capture window
const WARMUP_MS = parseInt(process.env.REEL_WARMUP_MS ?? '1500', 10); // let the player upgrade/start
const INTRO_S = 1.5;
const OUTRO_S = 2;
const HASHTAGS = '#systemdesign #softwarearchitecture #backend #coding #softwareengineering #distributedsystems';

const registry = JSON.parse(fs.readFileSync(path.join(ANIM, 'src/concepts/registry.json'), 'utf8'));

/** Escape text interpolated into the card HTML so a <, > or & can't break the render. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- captions -------------------------------------------------------------
/** Build the postable caption from existing registry fields. */
export function buildCaption(c) {
  const title = c.title.join('').trim();
  return `${title}\n\n${c.question}\n\n${c.summary}\n\nFull interactive version → solutionarch (link in bio)\n\n${HASHTAGS}`;
}

// ---- local asset server (mirrors make-posters.mjs) ------------------------
const TYPES = {'.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png'};
const playerPage = (slug) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>html,body{margin:0;background:#06080d;height:100%}.f{display:grid;place-items:center;height:100vh}
motion-canvas-player{width:1080px;height:1920px;display:block}</style>
<script type="importmap">{"imports":{"@motion-canvas/core":"/animations/core.js"}}</script>
<script type="module" src="/animations/player.js"></script>
</head><body><div class="f">
<motion-canvas-player src="/animations/${esc(slug)}.js" auto="true" quality="1" width="1080" height="1920"></motion-canvas-player>
</div></body></html>`;

function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const m = url.match(/^\/page\/(.+)$/);
    if (m) { res.writeHead(200, {'content-type': 'text/html'}); return res.end(playerPage(m[1])); }
    if (url.startsWith('/animations/')) {
      const file = path.join(OUT, url.slice('/animations/'.length));
      try { const d = fs.readFileSync(file); res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'}); return res.end(d); }
      catch { res.writeHead(404); return res.end('nf'); }
    }
    res.writeHead(404); res.end('nf');
  });
  return server;
}

// ---- frame capture (Playwright path; swap this if a native renderer appears) ----
const INK = () => {
  const host = document.querySelector('motion-canvas-player');
  const root = host && host.shadowRoot ? host.shadowRoot : document;
  const c = root.querySelector('canvas') || (host && host.querySelector('canvas'));
  if (!c) return 0;
  const w = 120, h = 213;
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const ctx = off.getContext('2d'); ctx.drawImage(c, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 110) n++;
  return n;
};

async function captureFrames(browser, port, slug, framesDir, fps) {
  const page = await browser.newPage({viewport: {width: 1120, height: 1960}, deviceScaleFactor: 1});
  try {
    await page.goto(`http://127.0.0.1:${port}/page/${slug}`, {waitUntil: 'load', timeout: 30000});
    const el = page.locator('motion-canvas-player').first();
    // warm up: wait until the canvas actually paints. If it never does (404/blank bundle or an
    // embed error), FAIL the concept instead of silently capturing a black reel — mirroring
    // make-posters.mjs's MIN_INK gate.
    let painted = false;
    const deadline = Date.now() + WARMUP_MS + 8000;
    while (Date.now() < deadline) {
      if ((await page.evaluate(INK)) > 200) { painted = true; break; }
      await page.waitForTimeout(150);
    }
    if (!painted) throw new Error('canvas never rendered — missing/blank bundle or embed error');
    await page.waitForTimeout(WARMUP_MS);
    const step = Math.round(1000 / fps);
    const count = Math.floor(BODY_MS / step);
    for (let i = 0; i < count; i++) {
      await el.screenshot({path: path.join(framesDir, `frame-${String(i + 1).padStart(5, '0')}.png`)});
      await page.waitForTimeout(step);
    }
    return count;
  } finally {
    await page.close();
  }
}

// ---- branded intro/outro cards (HTML -> PNG) ------------------------------
const card = (kind, c) => {
  const eyebrow = kind === 'intro' ? c.category : 'solutionarch — link in bio';
  const body = kind === 'intro' ? c.question : 'Full interactive version, live in your browser';
  const head = esc(c.title.slice(0, -1).join('')); // all title segments but the last
  const tail = esc(c.title[c.title.length - 1] ?? ''); // last segment gets the accent
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@500&display=swap">
<style>
  html,body{margin:0}
  .card{width:1080px;height:1920px;background:#0B0E14;color:#f8fafc;box-sizing:border-box;
    display:flex;flex-direction:column;justify-content:center;gap:44px;padding:150px 110px;
    font-family:"Inter",system-ui,sans-serif}
  .eyebrow{font-family:"JetBrains Mono",monospace;color:#2dd4bf;font-size:36px;letter-spacing:.12em;text-transform:uppercase}
  .title{font-size:108px;font-weight:800;line-height:1.04;margin:0}
  .title .accent{color:#2dd4bf}
  .body{font-size:50px;line-height:1.4;color:#8593a6;margin:0}
</style></head><body>
<div class="card">
  <span class="eyebrow">${esc(eyebrow)}</span>
  <h1 class="title">${head}<span class="accent">${tail}</span></h1>
  <p class="body">${esc(body)}</p>
</div></body></html>`;
};

async function renderCard(browser, kind, c, file) {
  const page = await browser.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
  try {
    await page.setContent(card(kind, c), {waitUntil: 'networkidle'});
    await page.waitForTimeout(300); // let webfonts paint
    await page.screenshot({path: file});
  } finally {
    await page.close();
  }
}

// ---- ffmpeg assembly ------------------------------------------------------
function hold(srcPng, framesDir, startIdx, frames) {
  for (let i = 0; i < frames; i++) {
    fs.copyFileSync(srcPng, path.join(framesDir, `seq-${String(startIdx + i).padStart(5, '0')}.png`));
  }
  return startIdx + frames;
}

function assemble(slug, framesDir, introPng, outroPng, bodyCount, fps) {
  let idx = 1;
  idx = hold(introPng, framesDir, idx, Math.round(INTRO_S * fps));
  for (let i = 1; i <= bodyCount; i++) {
    fs.copyFileSync(
      path.join(framesDir, `frame-${String(i).padStart(5, '0')}.png`),
      path.join(framesDir, `seq-${String(idx++).padStart(5, '0')}.png`),
    );
  }
  hold(outroPng, framesDir, idx, Math.round(OUTRO_S * fps));
  const out = path.join(REELS, `${slug}.mp4`);
  execSync(
    `ffmpeg -y -loglevel error -framerate ${fps} -i "${path.join(framesDir, 'seq-%05d.png')}" ` +
    `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" ` +
    `-c:v libx264 -pix_fmt yuv420p -movflags +faststart "${out}"`,
    {stdio: 'inherit'},
  );
  return out;
}

// ---- main -----------------------------------------------------------------
// Preflight: ffmpeg is a system binary, not an npm dep — fail fast and clearly if it's absent
// rather than after launching Chromium and capturing frames.
try { execSync('ffmpeg -version', {stdio: 'ignore'}); }
catch { console.error('[reels] ffmpeg not found on PATH — install it (e.g. `apt install ffmpeg`) and retry.'); process.exit(1); }

fs.mkdirSync(REELS, {recursive: true});
const captions = Object.fromEntries(registry.map((c) => [c.slug, buildCaption(c)]));
fs.writeFileSync(path.join(REELS, 'captions.json'), JSON.stringify(captions, null, 2));
console.log(`[reels] wrote captions for ${registry.length} concepts -> reels/captions.json`);

const ONLY = process.argv[2];
const todo = ONLY ? registry.filter((c) => c.slug === ONLY) : registry;
if (ONLY && !todo.length) { console.error(`[reels] no such concept: ${ONLY}`); process.exit(1); }

const {chromium} = await import('playwright');
let server, browser, ok = 0;
try {
  server = startServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  browser = await chromium.launch({headless: true});

  for (const c of todo) {
    const framesDir = path.join(REELS, `.frames-${c.slug}`);
    fs.rmSync(framesDir, {recursive: true, force: true});
    fs.mkdirSync(framesDir, {recursive: true});
    try {
      const intro = path.join(framesDir, 'intro.png');
      const outro = path.join(framesDir, 'outro.png');
      await renderCard(browser, 'intro', c, intro);
      await renderCard(browser, 'outro', c, outro);
      const bodyCount = await captureFrames(browser, port, c.slug, framesDir, FPS);
      const out = assemble(c.slug, framesDir, intro, outro, bodyCount, FPS);
      const kb = Math.round(fs.statSync(out).size / 1024);
      console.log(`[reels] ${c.slug} ✓ ${out} (${kb} KB, ${bodyCount} body frames)`);
      ok++;
    } catch (e) {
      console.error(`[reels] ${c.slug} ✗ ${String(e).slice(0, 200)}`);
    } finally {
      fs.rmSync(framesDir, {recursive: true, force: true});
    }
  }
} finally {
  if (browser) await browser.close();
  if (server) server.close();
}
console.log(`[reels] ${ok}/${todo.length} reel(s) rendered -> reels/`);
process.exit(ok === todo.length ? 0 : 1);
