# WealthDesk — Portfolio & Retirement Dashboard

**WealthDesk is an independent concept project inspired by the portfolio and
retirement-planning domain.** It is not affiliated with, endorsed by, or
connected to Fidelity Investments or any brokerage. No Fidelity logos,
trademarks, or brand assets are used. All market data is clearly-labeled
**simulated mock data** — there is no real market feed and no integration
with any real brokerage.

## What it is

A Fidelity-style dashboard built as an **Nx monorepo** to senior-engineer
standard: an Angular 22 frontend (standalone components, signals, OnPush,
lazy routes, functional guards, HTTP interceptors), an Express + TypeScript
REST API under `/api/v1`, and libraries split by kind with enforced module
boundaries. It exists so its author can **learn and defend** Angular,
TypeScript/JavaScript, RxJS, and Nx monorepo engineering in interviews —
every file carries a teaching header, and [LEARNING.md](./LEARNING.md) is a
guided tour of the whole system.

### Features

| Route | What it does |
| --- | --- |
| `/dashboard` | Net-worth stat cards, live quote ticker, allocation by sector, holdings table (trackBy + OnPush) |
| `/accounts` | Paged account list; select an account to see its holdings |
| `/planning` | 401(k)-style contribution planner: reactive form + server-side projection over years, with employer match |
| `/watchlist` | Symbol search (debounced) + watchlist with live simulated ticks |
| `/login` | Demo sign-in (any email works; no real identity provider) |

## How to run

Prerequisites: Node 24, npm 10.

```sh
npm ci --legacy-peer-deps   # --legacy-peer-deps: the @nx/webpack addition needed it
npx nx build api            # compile the API once
node dist/api/main.js       # API on http://localhost:3333
npx nx serve web            # Angular dev server on http://localhost:4200
```

The dev server proxies `/api` to `localhost:3333` (see
`apps/web/proxy.conf.json`), so the browser stays same-origin and the API
needs no CORS middleware. Open http://localhost:4200, sign in with any
email + a password of 8+ characters, and explore.

### Docker

```sh
docker compose up --build   # web on :8080, api on :3333
```

The web image is multi-stage (Node build → nginx serve); nginx proxies
`/api` to the api container (see `apps/web/nginx.conf`). Docker images
were authored but not built in the dev VM (no Docker there).

### Tests

```sh
npx nx run-many -t test                    # all Jest unit tests
cd apps/web-e2e && npx playwright test --project=chromium   # e2e (API must run on :3333 first)
```

The e2e spec covers login → dashboard net worth and the full planner flow
(20-year projection table). Run e2e with `--project=chromium` directly:
the `nx e2e` wrapper did not honor the project filter in this repo.

## Architecture overview

```
apps/web        Angular 22 SPA (standalone components, signals, lazy routes)
apps/api        Express + TypeScript REST API (/api/v1)
apps/web-e2e    Playwright e2e (chromium)
domain/         Shared DTOs + models (Account, Holding, Quote, Projection*)
util/           Pure helpers (money, projection math, event-loop demo, generics, validators)
data-access/    API client, auth, interceptors, signal stores, RxJS services
ui/             Dumb presentational components (stat card, holding table, allocation bar, ticker)
feature-*/      Smart containers + routes, one per page
tools/          Custom Nx generator (feature-lib) + custom executor (affected-report)
```

Rules that hold the shape together (enforced by ESLint
`enforce-module-boundaries` in `eslint.config.mjs`, plus tags in every
`project.json`):

- Apps may depend on libs; libs never depend on apps.
- `ui` may NOT depend on `feature` or `data-access` (dumb components stay dumb).
- `feature` → `data-access` / `ui` / `domain` / `util` only.
- `data-access` → `domain` / `util` only.
- `domain` depends on nothing; `util` depends only on `domain`.

Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the decision records (ADRs):
monorepo layout, signals vs NgRx, why module federation was rejected,
the mock-data boundary, REST vs GraphQL, and the Nx decisions in depth
(affected, caching, generators, executors, tags, migrations, DTE).
Read [JD_COVERAGE.md](./JD_COVERAGE.md) for the file-by-file mapping of
every Kforce JD requirement to the code that demonstrates it.

## Project map

| Project | Type | What lives there |
| --- | --- | --- |
| `web` | app | Angular shell, router, guards, proxy config |
| `api` | app | Express routes, mock data, error middleware |
| `web-e2e` | app | Playwright specs |
| `api-e2e` | app | Scaffold API e2e (unused placeholder) |
| `domain` | lib | Shared types |
| `util` | lib | Pure functions + runnable JS teaching demos |
| `data-access` | lib | HTTP, auth, stores, RxJS pipelines |
| `ui` | lib | Presentational components |
| `feature-dashboard`, `feature-accounts`, `feature-planning`, `feature-watchlist`, `feature-auth` | libs | One page each |
| `tools` | tooling | Custom generator + executor |

## Useful commands

```sh
npx nx show projects              # all 14 projects
npx nx graph                      # interactive project graph (browser)
npx nx affected -t lint test build # only what your change touches
npx nx run tools:affected-report  # markdown report of affected projects
npx nx g ./tools/generators.json:feature-lib --name=reports --dry-run
npx nx lint web                   # boundary rules live here
```

## Honest state

- The API serves **mock data** from in-memory structures; quotes random-walk
  ±0.5% per tick around fixed base prices. Nothing here is a real quote.
- Auth is a **demo token in localStorage**, not real authentication. The
  guard is a UX boundary; real security would live on the server.
- SSR ships from the scaffold (`apps/web/server.ts`) but the Docker image
  serves the SPA build; SSR is dev-only in this repo.
- CI definitions (Jenkinsfile, `.github/workflows/ci.yml`) are authored,
  not executed here. Docker images were not built here (no Docker in the
  dev VM). Jenkins needs its `node-24` tool name matched to your server.
- The Angular dev-server builder prints a webpack deprecation warning
  (Angular is migrating to its new build system); the webpack builder is
  kept deliberately because the JD names Webpack — see ADR-10.
