# solutionarch — architecture concepts, animated

[![CI](https://github.com/salahawad/solution-arch/actions/workflows/ci.yml/badge.svg)](https://github.com/salahawad/solution-arch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Live site](https://img.shields.io/badge/live-solution--arch.vercel.app-0aa)](https://solution-arch.vercel.app)

A public website that teaches senior-architect concepts as **short, interactive visual
animations** built with [Motion Canvas](https://motioncanvas.io). Each concept renders
**live in the browser** — play, pause, and scrub through the idea — in a dark
"observability dashboard" style.

**▶ Live: [solution-arch.vercel.app](https://solution-arch.vercel.app)**

## The library

17 concepts, each with a bespoke storyboard and an embeddable live player:

| Concept | What it shows |
| --- | --- |
| [Load Balancing](https://solution-arch.vercel.app/concepts/load-balancing/) | Spread requests across servers so no single box melts while the others sit idle. |
| [Apache Kafka](https://solution-arch.vercel.app/concepts/kafka/) | Durable, partitioned event streaming that decouples producers from consumers. |
| [Redis](https://solution-arch.vercel.app/concepts/redis/) | An in-memory store: microsecond reads, the cache-aside pattern, and pub/sub. |
| [Sharding](https://solution-arch.vercel.app/concepts/sharding/) | Split one huge dataset across nodes by shard key so writes scale horizontally. |
| [CDN](https://solution-arch.vercel.app/concepts/cdn/) | Serve users from the nearest edge instead of a single far-away origin. |
| [Rate Limiting](https://solution-arch.vercel.app/concepts/rate-limiting/) | A token bucket smooths bursts and shields the backend from overload. |
| [Circuit Breaker](https://solution-arch.vercel.app/concepts/circuit-breaker/) | Trip open on a failing dependency so calls fail fast instead of dragging the whole system down. |
| [Retry Backoff](https://solution-arch.vercel.app/concepts/retry-backoff/) | Spread retries with exponential backoff and jitter so a blip doesn't become a self-inflicted stampede. |
| [Idempotency](https://solution-arch.vercel.app/concepts/idempotency/) | Make an operation safe to repeat so a retried request is processed exactly once, not twice. |
| [Database Replication](https://solution-arch.vercel.app/concepts/replication/) | Copy writes from a primary to read replicas to scale reads and survive a node failure. |
| [Saga](https://solution-arch.vercel.app/concepts/saga/) | Coordinate a transaction across services with local commits and compensating actions instead of 2PC. |
| [CAP Theorem](https://solution-arch.vercel.app/concepts/cap-theorem/) | Under a network partition you can keep consistency or availability — not both. Choose per use case. |
| [Event Sourcing](https://solution-arch.vercel.app/concepts/event-sourcing/) | Store the immutable stream of changes, not just current state — and build read models (CQRS) from it. |
| [Consistent Hashing](https://solution-arch.vercel.app/concepts/consistent-hashing/) | Map keys to nodes on a ring so adding or removing a node moves only a small slice of keys. |
| [API Gateway](https://solution-arch.vercel.app/concepts/api-gateway/) | Put one front door in front of your services for routing, auth, rate-limiting and aggregation. |
| [Message Queue](https://solution-arch.vercel.app/concepts/message-queue/) | Put a queue between producer and consumer to decouple them and absorb spikes instead of dropping work. |
| [Leader Election](https://solution-arch.vercel.app/concepts/leader-election/) | Use a quorum to agree on a single leader so two nodes never both act as primary. |

The list is driven by [`packages/animations/src/concepts/registry.json`](packages/animations/src/concepts/registry.json) — the single source of truth.

## Monorepo layout

```text
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

Requires Node 20–22 (`.nvmrc` pins 20) and [pnpm](https://pnpm.io) 10.

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
  (see `vercel.json`). The Vercel project's Root Directory is `packages`, so Astro is
  configured to emit the site to `packages/dist` — the `dist` Vercel actually serves.
- CI (`.github/workflows/ci.yml`) rebuilds embeds, posters, and the site on a clean checkout,
  and fails if any concept won't compile or the committed manifest drifts from the registry.

## Stack

Motion Canvas 3.17 · Vite 5 · Astro 5 · pnpm workspaces · Vercel (static).

## License

[MIT](./LICENSE) © Salah Awad. The animations are built on
[Motion Canvas](https://motioncanvas.io) (also MIT).
