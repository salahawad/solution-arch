# solutionarch — architecture concepts, animated

A public website that teaches senior-architect concepts (Load Balancing, Kafka, Redis,
Sharding, CDN, Rate Limiting, …) as **short, interactive visual animations** built with
[Motion Canvas](https://motioncanvas.io). Each concept renders **live in the browser** —
play, pause, and scrub through the idea — in a dark "observability dashboard" style.

## Monorepo layout

```
packages/
  animations/        Motion Canvas project (vertical 9:16, 1080×1920)
    src/
      theme.ts                design tokens (the shared dark dashboard look)
      components.tsx          reusable nodes: GlowNode, ServerNode, FlowEdge,
                              BalancerNode/sonar, DbNode, Bucket, StatCard, TitleBlock…
      lib/                    animation + edge helpers
      concepts/<slug>/scene.tsx   one bespoke storyboard per concept
      concepts/registry.json      single source of truth for the library
      projects/<slug>.ts          one embeddable Motion Canvas project per concept
    scripts/
      build-embeds.mjs        builds each concept to an embeddable bundle (core
                              externalized + shared), vendors core.js, copies player.js,
                              writes the site manifest
      make-posters.mjs        renders a poster PNG per concept via a headless browser
  site/              Astro static site (deploys to Vercel)
    src/pages/index.astro            gallery
    src/pages/concepts/[slug].astro  concept page with the lazy live player
    public/animations/               committed runtime assets (bundles, core, player, posters)
```

## How the live player works

Motion Canvas's `@motion-canvas/player` web component renders a built project bundle. To
keep each concept bundle small and avoid a dual-core mismatch, concept bundles **externalize
`@motion-canvas/core`**; the site provides one shared `core.js` via an import map. The
player + 316 KB core are **loaded on demand** (only when the visitor hits play), and the
player is sized with explicit `width="1080" height="1920"` attributes.

## Develop

```bash
pnpm install
pnpm dev:anim     # Motion Canvas editor (preview every concept) at :9000
pnpm dev:site     # Astro dev server
```

## Add a concept

1. `src/concepts/<slug>/scene.tsx` (+ `scene.meta`) — compose the reusable components.
2. `src/projects/<slug>.ts` — `makeProject({ scenes: [scene] })`.
3. Add an entry to `src/concepts/registry.json`.
4. `pnpm rebuild:all` — rebuilds bundles, posters, manifest, and the site.

## Build & deploy

- `pnpm rebuild:all` regenerates the animation assets (needs a browser for posters) and
  builds the site.
- The publishable assets are committed, so **Vercel only runs `pnpm --filter @sa/site build`**
  (see `vercel.json`). Output: `packages/site/dist`.

## Stack

Motion Canvas 3.17 · Vite 5 · Astro 5 · pnpm workspaces · Vercel (static).
