// Build-time cache-busting for poster PNGs.
//
// Poster filenames are stable (/animations/<slug>.png), so a browser keeps
// reusing a cached copy even after the file's bytes change — that's why a
// freshly regenerated poster can keep showing the old frame until a hard
// reload. Appending ?v=<content-hash> makes the URL change exactly when the
// bytes change, so a normal reload refetches and otherwise the cache stands.
//
// Runs only in Astro frontmatter (dev: per request, build: once) — fs/crypto
// never reach the browser.
import {createHash} from "node:crypto";
import {readFileSync, statSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

// This file is at <site>/src/lib/posterUrl.ts → ROOT = packages/site.
// Resolved from import.meta.url (not cwd) so it's correct under `pnpm -w`.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Keyed by path + mtime so a poster regenerated while `astro dev` is running
// (the module-level Map outlives a single request) invalidates automatically.
const cache = new Map<string, string>();
const miss = new Set<string>(); // public-rooted paths that don't resolve — skip re-statting

/**
 * Map a public-rooted path like "/animations/load-balancing.png" to
 * "/animations/load-balancing.png?v=ab12cd34" (8-char digest of the bytes).
 * Returns the input unchanged if the file can't be read, so a missing asset
 * never breaks the build.
 */
export function posterUrl(poster: string): string {
  if (miss.has(poster)) return poster; // negative cache: don't re-stat a known-absent asset
  try {
    const file = path.join(ROOT, "public", poster.replace(/^\//, ""));
    const key = `${poster}:${statSync(file).mtimeMs}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
    const sep = poster.includes("?") ? "&" : "?";
    const out = `${poster}${sep}v=${hash}`;
    cache.set(key, out);
    return out;
  } catch {
    miss.add(poster); // asset absent in this context — ship the plain URL, don't re-stat it
    return poster;
  }
}
