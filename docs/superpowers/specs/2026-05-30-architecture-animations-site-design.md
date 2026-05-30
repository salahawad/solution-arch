# Architecture Concept Animations — Public Vercel Site (Design Spec)

**Date:** 2026-05-30
**Status:** Approved (design); Phase 1 to be planned & implemented
**Owner:** salahawad

## 1. Goal

A **public website that teaches senior-architect concepts** (Kafka, Redis, Sharding, Load
Balancing, and a growing library) as **short, interactive visual animations**, built with
**Motion Canvas**, deployed to **Vercel**. The look mirrors @krishnachaytanyaa's "Load
Balancing" reel: a dark observability-dashboard aesthetic with glowing nodes, flowing
connection lines, before/after problem→solution states, and live count-up metric cards.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Animation tool | Motion Canvas (v3.17.2, pinned) |
| Aspect ratio | Vertical 9:16 (1080×1920) |
| Explanation channel | On-screen animated captions + background music (music = Phase 2) |
| Playback model | **Live player per concept page + static poster in gallery + video as later fallback** |
| Site framework | Astro + Tailwind (dark), `@astrojs/vercel/static` |
| Repo layout | pnpm monorepo: `packages/animations` (MC) + `packages/site` (Astro) |
| Build target | Vercel (static, auto-detected) |
| Library growth | Data-driven scenes on a shared design system; add a concept cheaply |

### Playback model rationale

Research found the official `@motion-canvas/player` is fragile: it was "quick and dirty"
for the docs site, **multiple instances on one page degrade performance**, there is a known
**audio-cleanup bug on unmount** (motion-canvas issue #605), its API docs are incomplete,
and it is **likely deprecated in Motion Canvas v4** in favor of a Lottie exporter. We
therefore:

- Embed **one** live player instance **per concept page**, lazy-loaded (`client:visible`),
  pinned to v3.17.2. Single-instance-per-page avoids the multi-player perf cliff; Astro
  full-page navigation (MPA) avoids the unmount audio leak; the player's play button
  satisfies browser autoplay-gesture rules.
- Use a **static poster image** (rendered final-frame PNG) in the gallery grid — no heavy
  players in the grid.
- Keep a **video export** path open as a fallback / social asset (Phase 2), so the site
  survives a future v4 player removal.

## 3. Scope — phased

This is a large system; we ship one **end-to-end vertical slice** first, then scale.

### Phase 1 (this spec — to be planned next)
- pnpm monorepo scaffold + tooling.
- Reusable **design-system component library** in `packages/animations`.
- **One concept: Load Balancing**, deliberately recreating the reference reel (proves the
  template matches the look) — built to an embeddable bundle + a poster PNG.
- **Minimal Astro site**: a landing/gallery showing the one concept, and a concept page
  embedding the live player (lazy) with the poster as fallback. Dark theme.
- **Deployed to Vercel.**

**Out of scope for Phase 1** (deferred): background music, automated video rendering,
additional concepts, OG-image generation, search/categories, theme toggle.

### Phase 2
Kafka, Redis, Sharding on the locked template; gallery categories/tags; background music;
video export pipeline + OG social images.

### Phase 3
Scale the library (Consistent Hashing, CAP, Replication, Rate Limiting, CDN, Circuit
Breaker, API Gateway, Idempotency, Leader Election, Event Sourcing/CQRS, …); search; polish.

**Pilot = Load Balancing** because it *is* the reference reel — the strongest proof the
template nails the style — and it exercises every core component (nodes, flowing edges,
sonar node, before/after states, count-up stat cards).

## 4. Repository structure

```
solution-arch/
  pnpm-workspace.yaml
  package.json                       # root scripts: dev, build (delegates to -r)
  packages/
    animations/                      # Motion Canvas — pinned Vite 5 / Node 16+ / MC 3.17.2
      package.json
      vite.config.ts                 # @motion-canvas/vite-plugin
      src/
        theme.ts                     # design tokens (colors, fonts, spacing, glow)
        lib/
          flow.ts                    # countUp(), flowAlong(edge), revealStagger(nodes)
        components/
          TitleCard.tsx
          SectionPill.tsx
          GlowNode.tsx
          ServerNode.tsx
          FlowEdge.tsx
          SonarNode.tsx
          StatCard.tsx               # + StatRow
        concepts/
          load-balancing/
            data.ts                  # storyboard (title, sections, nodes, edges, metrics)
            scene.tsx                # makeScene2D generator that renders data.ts
        projects/
          load-balancing.ts          # makeProject({ scenes: [scene] }) → one bundle
      public/fonts/                  # Inter + JetBrains Mono (@font-face)
    site/                            # Astro + Tailwind + @astrojs/vercel/static
      package.json
      astro.config.mjs               # output: 'static', adapter: vercelStatic()
      tailwind.config.mjs            # darkMode: 'class'
      src/
        content/
          config.ts                  # concepts collection schema (zod)
          concepts/
            load-balancing.md        # metadata: title, tag, slug, summary, poster, bundle
        components/
          Player.tsx                 # island wrapping <motion-canvas-player>, client:visible
          ConceptCard.astro
        layouts/Base.astro
        pages/
          index.astro                # gallery / landing
          concepts/[slug].astro      # concept page (player + poster fallback)
        styles/global.css
      public/animations/             # GENERATED: load-balancing.js + load-balancing.png
  docs/superpowers/specs/            # this spec + future specs
```

**Why monorepo:** Motion Canvas pins to Vite 4–5 / Node 16+ (not Vite 7); the Astro site
wants a modern toolchain. Separate packages isolate the version ceiling cleanly.

## 5. Animation engine

### 5.1 Reusable components

Built with Motion Canvas's JSX runtime (not React — JSX tags create Node instances
directly). Simple composites use **factory functions returning JSX**; stateful/typed
components extend a base class (`Node`/`Rect`/`Layout`) with `@signal()` / `@initial()` /
`@computed()` decorators. (Note: there is **no `@nodeName`** decorator in v3.17 — class
name only.)

- **`TitleCard`** — `@handle` line + split-color title (white + teal accent) + muted subtitle.
- **`SectionPill`** — labeled pill with `variant: 'problem' | 'solution'` (coral / teal border) + short descriptor text.
- **`GlowNode`** — rounded `Rect` (`radius≈16`, faint fill, teal `stroke`, `shadowColor` + `shadowBlur` for the glow) with a centered label. Variants: `request | server | balancer`.
- **`ServerNode`** — `GlowNode` + a metric badge (`0%` → `100%`), color shifts teal→coral as load rises.
- **`FlowEdge`** — a `Line` between two node refs with a dot traveling along it via `getPointAtPercentage(progress)` (alternative: animated `lineDash` offset for a flowing-dash look). Supports `endArrow`.
- **`SonarNode`** — central node with concentric rings that expand outward on `loop` (the load-balancer "sonar" effect).
- **`StatCard`** / **`StatRow`** — rounded panel, uppercase mono label + a **count-up** value driven by `createSignal` and `yield* count(target, dur)`, displayed via `text={() => count().toFixed(0)}`. `StatRow` is a `Layout` row.

### 5.2 Scene anatomy (data-driven)

Each concept = a `data.ts` storyboard + a `scene.tsx` generator that sequences it, so new
concepts are mostly data:

```ts
// data.ts shape (illustrative)
export default {
  handle: '@solution-arch',
  title: ['Load ', 'Balancing'],          // [white, accent]
  subtitle: 'why one server melts while the others sit idle',
  sections: [
    { variant: 'problem',  pill: 'NO BALANCER', note: 'every request slams one box',
      nodes: [...], edges: [...], metrics: { requests:'0 of 9', served:'0 (cap 3)', dropped:'0' } },
    { variant: 'solution', pill: 'ROUND ROBIN', note: 'the balancer takes turns 1→2→3',
      nodes: [...], edges: [...], metrics: { requests:'9 of 9', served:'evenly', dropped:'0' } },
  ],
}
```

`scene.tsx` flow: **title in → for each section: reveal nodes (`revealStagger`) → animate
flow (`all`/`sequence` of `FlowEdge`s) → count up stats → hold → transition out → next
section → outro**, orchestrated with `all() / chain() / sequence() / waitFor()`.

### 5.3 Visual design tokens (`theme.ts`)

- **Background:** near-black `#0B0E14` with a deep-navy radial glow (research: avoid pure
  black for shadow contrast).
- **Accents:** teal `#2DD4BF` (healthy/flow), coral `#FB7185` (overload/dropped), muted
  `#6B7280` (labels), title white `#F8FAFC`.
- **Fonts:** Inter (title/UI), JetBrains Mono (labels: `web-1`, `0%`, stat values) — loaded
  via `@font-face` from `public/fonts`.
- **Geometry:** node `radius≈16`, stroke `1.5px`, glow `shadowBlur≈20`; edges `2px`; stat
  panels rounded with subtle fill.

### 5.4 Motion Canvas facts (verified, for implementers)

- Scaffold: `npm init @motion-canvas@latest` → `src/project.ts`, `src/scenes/*.tsx`, `vite.config.ts`.
- Scenes: `makeScene2D(function* (view) { view.add(<...>); yield* ...; })`. `yield*` delegates to reusable sub-generators.
- **Vertical resolution 1080×1920** is configured up front (`project.meta` `shared.size {x:1080,y:1920}` / project config). **Animations do not auto-scale to resolution — plan resolution first.**
- Multi-scene/project: `makeProject({ scenes })`; scene imports require the **`?scene`** suffix. One `makeProject` → one embeddable bundle (one project file per concept video).
- Signals/timing: `createSignal`, `yield* count(9, 2)`, `tween`, `spring`, easings; `all/chain/sequence/waitFor/waitUntil/delay/loop`. `loop()` must be `spawn`ed, not `yield*`-ed.
- Edges/particles: `Line` (`points`, `lineDash`, `startArrow/endArrow/arrowSize`), `Path/Spline.getPointAtPercentage(p)` for a dot following a path.
- Player embed: `<motion-canvas-player src="/animations/<concept>.js">`, registered by importing `@motion-canvas/player`; bundle produced by Vite build.
- Constraints: Node ≥16, Vite 4–5 (not 7), MC 3.17.2.

## 6. The site (Astro)

- **Landing / gallery** (`index.astro`): dark hero + a grid of `ConceptCard`s (poster
  thumbnail, title, tag). Phase 1 shows the single Load Balancing card.
- **Concept page** (`concepts/[slug].astro`): title/summary + the **`Player` island**
  (`client:visible`) embedding `<motion-canvas-player>` for that concept's bundle, with the
  **poster PNG shown until the player hydrates** (and as fallback). Vertical 9:16 framed
  responsively (`aspect-ratio: 9/16`, centered, max-height capped on desktop).
- **Content collection** (`content/concepts`): zod-schema metadata (`title, tag, slug,
  summary, poster, bundle`) so cards/pages are generated from data.
- **Theme:** Tailwind `darkMode: 'class'`, dark by default; tokens mirror `theme.ts` so the
  page and the animation feel like one product.

## 7. Build & deploy pipeline

1. `pnpm -r build` builds both packages in dependency order.
2. `packages/animations` build emits `load-balancing.js` (+ `load-balancing.png` poster)
   into `packages/site/public/animations/` (postbuild copy or build output target).
3. `astro build` includes those static assets in `dist/`.
4. **Vercel** auto-detects Astro; `@astrojs/vercel/static`; build command `pnpm build`,
   output `packages/site/dist`. Bundles are versioned/cache-busted static assets (CDN-cached).

**Gotchas to honor:** bundles must land in `public/animations/` **before** `astro build`;
the `<motion-canvas-player>` must be wrapped in a framework island to use `client:visible`;
OG-image paths (Phase 2) must be absolute URLs.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Headless **video rendering** unproven (MC renderer is editor-driven) | Phase 1 uses static **PNG posters** (trivial); video is Phase 2 and may stay editor-triggered |
| `@motion-canvas/player` **fragile / v4-deprecated** | Pin v3.17.2; one instance per page; keep video fallback path viable |
| MC ↔ **Vite version ceiling** (no Vite 7) | Isolated in its own monorepo package |
| **Audio autoplay** blocked without gesture | Music deferred to Phase 2; gated behind the play button |
| Poster generation | Export a single final frame from the MC scene (or screenshot the rendered last frame) |

## 9. Success criteria (Phase 1)

1. `pnpm install && pnpm build` succeeds from a clean checkout.
2. The Load Balancing animation runs in the MC editor and visually matches the reference
   reel's style (dark dashboard, glowing nodes, flowing edges, before/after, count-up stats).
3. The Astro site builds; the concept page embeds and plays the live player; the poster
   shows before hydration and as fallback; the gallery shows the concept card.
4. The site deploys to Vercel and is reachable at a public URL.
5. Adding a *second* concept later requires only a new `data.ts` (+ minor bespoke visuals)
   and a content entry — the shared components are reused.

## 10. Open questions (non-blocking; defaults chosen)

- Final color hex values may be tuned against the reel during implementation (tokens above
  are the starting point).
- Public domain/subdomain for Vercel: TBD by owner (default: Vercel-generated URL).
- Background-music track sourcing: Phase 2.
