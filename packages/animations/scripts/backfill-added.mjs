#!/usr/bin/env node
/**
 * One-off: stamp an `added` ISO date (YYYY-MM-DD) onto every registry entry from git
 * history — the date each concept's scene.tsx was first committed. Untracked/new concepts
 * (no commit yet) fall back to FALLBACK. Idempotent: re-running only fills missing dates.
 */
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ANIM = path.resolve(here, '..');
const REG = path.join(ANIM, 'src/concepts/registry.json');
const FALLBACK = '2026-06-01'; // concepts not yet committed get today's date

const registry = JSON.parse(fs.readFileSync(REG, 'utf8'));
let filled = 0;
for (const c of registry) {
  if (c.added) continue; // idempotent
  const scene = path.join(ANIM, 'src/concepts', c.slug, 'scene.tsx');
  let date = FALLBACK;
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format=%as --reverse -- "${scene}"`,
      {cwd: ANIM, encoding: 'utf8'},
    ).trim().split('\n').filter(Boolean)[0];
    if (out) date = out;
  } catch {}
  c.added = date;
  filled++;
  console.log(`[backfill] ${c.slug} -> ${date}${date === FALLBACK ? ' (fallback)' : ''}`);
}
fs.writeFileSync(REG, JSON.stringify(registry, null, 2) + '\n');
console.log(`[backfill] filled ${filled} concept(s); ${registry.length} total`);
