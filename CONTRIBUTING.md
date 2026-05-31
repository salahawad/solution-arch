# Contributing

Thanks for your interest in **solutionarch**! It's a small pnpm monorepo, and most
contributions add or refine a single concept animation. This guide covers setup, the
pre-PR checklist, and conventions. For the architecture and what lives where, see the
[README](./README.md).

## Prerequisites

- Node 20–22 (`.nvmrc` pins 20)
- [pnpm](https://pnpm.io) 10

```bash
pnpm install
```

## Develop

```bash
pnpm dev:anim     # Motion Canvas editor (preview every concept) at :9000
pnpm dev:site     # Astro dev server
```

## Add or change a concept

Follow the **[Add a concept](./README.md#add-a-concept)** steps in the README. In short:
edit the scene / project / registry under `packages/animations/`, then run `pnpm rebuild:all`
from the repo root and **commit the regenerated `packages/site/src/concepts.json` plus the
bundle and poster under `packages/site/public/animations/`** along with your source changes.

Poster generation needs a headless Chromium. If your environment doesn't have one:

```bash
pnpm --filter @sa/animations exec playwright install --with-deps chromium
```

## Before you open a PR

Run the same checks CI runs, on a clean tree:

```bash
pnpm rebuild:all
git diff --exit-code -- packages/site/src/concepts.json   # manifest must be in sync
```

If `git diff` reports changes, commit the regenerated files — a stale manifest fails CI.

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`,
`chore:`, `docs:`, `refactor:`, `revert:`, with an optional scope — e.g.
`feat(concepts): add consistent-hashing`.

## Pull requests

- Branch off `main` and open your PR against `main`.
- Keep PRs focused — one concept or one fix per PR where practical.
- CI must be green: it rebuilds embeds, posters, and the site on a clean checkout, and checks
  that the committed manifest matches the registry.
