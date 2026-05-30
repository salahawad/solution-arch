# Architecture Concepts Expansion — Design

Date: 2026-05-30
Status: approved (scope + framing), implementation in progress

## Goal

Grow the solution-arch animated concept library from 6 to 17 by adding the canonical
must-have patterns and the pitfalls behind the biggest real-world outages, and make the
homepage scale to that size with **category grouping** and **client-side search**.

Existing 6: Load Balancing, Apache Kafka, Redis, Sharding, CDN, Rate Limiting.

## The 11 new concepts (problem → solution)

| # | Concept | Category | Problem | Solution |
|---|---------|----------|---------|----------|
| 1 | Circuit Breaker | Resilience | slow dependency → threads exhaust → caller dies too (cascade) | breaker OPENs, fails fast, half-open probe, recovers |
| 2 | Retry + Backoff | Resilience | synchronized retries → retry storm | exponential backoff + jitter spreads load |
| 3 | Idempotency | Resilience | retry double-charges | idempotency key dedupes → exactly once |
| 4 | Database Replication | Data | single primary = SPOF + read bottleneck | primary + read replicas, failover |
| 5 | Saga | Data | cross-service txn, no 2PC, partial failure | local txns + compensating rollback |
| 6 | CAP Theorem | Data | partition forces a choice | pick CP (reject) or AP (serve stale) |
| 7 | Event Sourcing / CQRS | Data | mutable state loses history, read/write contention | append-only log + projections |
| 8 | Consistent Hashing | Scaling | hash%N → add node remaps ~all keys | hash ring, only K/N keys move |
| 9 | API Gateway | Networking | clients call N services, auth duplicated | one entry: routing/auth/aggregation |
| 10 | Message Queue | Messaging | sync coupling drops work on spikes | queue buffers, workers drain |
| 11 | Leader Election | Coordination | split brain — two primaries | quorum (Raft) elects one leader |

New category **Coordination** is added to the homepage `order` array.

## Per-concept file structure (mirrors existing)

For each `<slug>`:
- `src/concepts/<slug>/scene.tsx` — Motion Canvas 9:16 scene, two stacked panels
  (problem ~y −830..−180, solution ~y 70..700), reusing `components.tsx` + `theme.ts`.
- `src/concepts/<slug>/scene.meta` — `{"version":0,"timeEvents":[],"seed":1700000000}`
- `src/projects/<slug>.ts` — `makeProject({scenes:[scene]})` importing the scene
- `src/projects/<slug>.meta` — `{"version":0}`
- `registry.json` entry — slug, title (A/B split), category, summary, question, 4 architect `details`
- one line added to `src/project.ts` (editor preview)

## Content ownership

- **Animation scenes** are authored in parallel (one agent per concept), each
  **build-verified** (`vite build` with `MC_PROJECT`) and repaired if it doesn't compile —
  the build is the correctness gate. Visual quality is spot-checked via the generated poster.
- **Registry text** (summary, question, 4 architect-grade `details` bullets) is curated by
  hand for consistency with the existing 6, then assembled into `registry.json`.

## Homepage: categorize + search

- Group cards under per-category headings (`.cat-head`) in `order`:
  Scaling, Messaging, Caching, Data, Networking, Resilience, Coordination.
- A search box + category filter pills above the library. Client-side only (static site):
  each card carries `data-category` + a lowercased `data-search` (title+summary+category);
  an inline script hides non-matching cards, hides empty category sections, and updates a
  live result count. Category pills narrow to one category; search narrows by text.

## Build + verify

Pipeline unchanged: `build-embeds` (per-concept bundle + regenerated `concepts.json`) →
`make-posters` (content-based best-frame). Verify: every bundle compiles, every poster
generates, homepage shows 17 cards grouped by category, search filters correctly.

## Out of scope

No changes to the existing 6 scenes; no backend/search-index (client-side filter only);
no per-concept deep-dive pages beyond the existing detail page.
