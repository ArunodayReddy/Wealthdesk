# JD_COVERAGE.md — Kforce JD requirement → code mapping

Every requirement from the Kforce Angular NX Developer JD, mapped to the
exact files that demonstrate it. Read this with the code open: each row
is a claim you can verify by opening the file. Where the JD names a
pattern rather than a tool (Cypress) or lists something as nice-to-have
(native mobile), that is stated explicitly instead of faked.

## Angular

| JD item | Where it lives | What to point at in an interview |
| --- | --- | --- |
| Standalone components | Every component: `ui/src/lib/*.component.ts`, `feature-*/src/lib/*.component.ts`, `apps/web/src/app/app.ts` | `standalone: true`, no NgModule anywhere in new code |
| Signals | `data-access/src/lib/accounts.store.ts`, `data-access/src/lib/auth.service.ts` | `signal()` state; `computed()` derivations (`netWorth`, `selectedHoldings`, `allocation`) |
| OnPush change detection | Every component (`changeDetection: ChangeDetectionStrategy.OnPush`) | Stores `.set()` new array references so OnPush sees input changes; no mutation |
| RxJS — switchMap | `data-access/src/lib/accounts.store.ts` (quote polling pipeline), `data-access/src/lib/watchlist.service.ts` (debounced search) | New value cancels the old request |
| RxJS — mergeMap | `data-access/src/lib/accounts.store.ts` (`refreshAllHoldings`, concurrency 3) | Bounded concurrent holdings refresh |
| RxJS — concatMap | `data-access/src/lib/watchlist.service.ts` (add queue) | Ordered, one-at-a-time adds |
| RxJS — exhaustMap | `data-access/src/lib/planning.service.ts` (submit pipeline) | Double-submit dropped while a projection is in flight; proven by `planning.service.spec.ts` |
| DI (dependency injection) | All services/components via `inject()` (e.g. `accounts.store.ts`, `app.ts`, `auth.guard.ts`) | Constructor-free `inject()` style; `providedIn: 'root'` services |
| Reactive forms | `feature-auth/src/lib/login.component.ts`, `feature-planning/src/lib/planner.component.ts` | `FormBuilder.nonNullable`, per-control validators + form-level validator reusing shared pure rules; `planner.component.spec.ts` tests the validator without TestBed |
| Routing: lazy loading | `apps/web/src/app/app.routes.ts` (`loadChildren` per feature) | One webpack chunk per feature — visible in `nx build web` output |
| Routing: guards | `apps/web/src/app/auth.guard.ts` (functional `CanActivateFn`, UrlTree redirect) | Guard on the parent route runs before the lazy chunk loads; lives in the shell because Nx forbids statically importing a lazy lib (ADR-2) |
| HTTP interceptors | `data-access/src/lib/interceptors.ts`, registered in `apps/web/src/app/app.config.ts` | `authInterceptor` then `errorInterceptor`; requests cloned, never mutated |
| Testing (Angular) | `ui/src/lib/ui.spec.ts`, `data-access/src/lib/*.spec.ts`, `feature-planning/src/lib/planner.component.spec.ts` | Component rendering, store/service behavior, operator behavior, form validation |

## JavaScript / TypeScript

| JD item | Where it lives | What to point at |
| --- | --- | --- |
| Promises | `util/src/lib/event-loop.ts` (`doubleWithPromise`, promisify) | Callback → promise bridge; the exact pattern `util.promisify` implements |
| Callbacks | `util/src/lib/event-loop.ts` (`doubleWithCallback`, error-first) | Node error-first convention; why it composes badly |
| Event loop | `util/src/lib/event-loop.ts` (`runEventLoopDemo`), `util/src/lib/event-loop.spec.ts` | Runnable microtask-vs-macrotask ordering demo; spec pins queueMicrotask-before-then (enqueue order) |
| async/await | `util/src/lib/async-demo.ts` + `async-demo.spec.ts`; also `api/src/main.ts` (ready-signal await), `tools/generators/feature-lib/generator.ts` (`await formatFiles`) | Sequential vs `Promise.all` parallel vs try/catch; the `.then()`-chain desugar equivalence |
| Closures | `util/src/lib/event-loop.ts` (`createCounter`) | Private state without classes; the mechanism under hooks/signal factories |
| Generics | `util/src/lib/generics.ts` (`pluck`, `groupBy`) | One loop for many types; `groupBy` powers the allocation computation |
| Utility types | `util/src/lib/generics.ts` | `Partial` / `Pick` / `Omit` / `Record` / `Readonly` with when-to-use notes |

## Node / Express / REST / API design

| JD item | Where it lives | What to point at |
| --- | --- | --- |
| Node / Express | `api/src/main.ts`, `api/src/routes.ts`, `api/src/errors.ts`, `api/src/data.ts` | Middleware order (json → router → 404 → 4-arg error handler); sync handlers (Express 4 doesn't catch async rejections); webpack bundle run by plain `node dist/api/main.js` |
| REST API design | `api/src/routes.ts` | Versioned prefix `/api/v1`; resource routes; `PagedResponse` pagination envelope (`?page=&pageSize=`); JSON error bodies with proper codes (400 validation with details, 404 unknown route/id) |
| API design / microservices thinking | `ARCHITECTURE.md` ADR-6; `api/src/routes.ts` | Routes are service-shaped (accounts, quotes, projection) behind one versioned prefix — splittable into services later without frontend changes; server re-validates with the same pure rules the client runs |
| CSS / HTML | `apps/web/src/styles.css`, component `styles` in every component, `apps/web/src/index.html` | Global baseline + co-located component styles; semantic markup (`table`, `label`, `nav`); allocation bar in pure CSS (no chart lib by choice) |
| HTTP | `data-access/src/lib/api-client.ts`, `apps/web/proxy.conf.json`, `apps/web/nginx.conf` | Relative `/api/v1` base, same-origin via dev proxy and prod nginx proxy; no CORS on the API by design |

## Tooling

| JD item | Where it lives | What to point at |
| --- | --- | --- |
| ESLint | Root `eslint.config.mjs` (boundary rule + depConstraints), per-project configs | `enforce-module-boundaries` + tags; the `wd-` selector prefix fix (scaffold said `lib`, components use `wd-`) |
| Webpack | `apps/web/project.json` (`@angular-devkit/build-angular` browser builder), `api` webpack build via `@nx/webpack` | Lazy chunks from `loadChildren`; bundle output `dist/apps/web/browser`; kept deliberately despite Angular's deprecation warning (ADR-10) |
| Nx monorepo | Whole repo; `nx.json` (plugin inference), `tsconfig.base.json` (path aliases), `.nxignore` | `nx show projects` (14), `nx graph`, `nx affected`, caching, tags + boundaries |
| Nx — project graph | `nx.json`, all `project.json` files | Run `npx nx graph` and trace web → features → data-access/ui → domain/util |
| Nx — affected | `Jenkinsfile`, `.github/workflows/ci.yml`, `tools/executors/affected-report/` | `nx affected -t lint test build`; executor writes `affected-report.md`; demo in LEARNING.md stop 13 |
| Nx — computation caching | `nx.json` (`namedInputs`, `targetDefaults`) | Second `nx build web` replays dependency tasks from cache (verified); remote cache / DTE explained in ADR-8, not run (needs Nx Cloud) |
| Nx — custom generator | `tools/generators/feature-lib/` + `tools/generators.json` | Scaffolds a feature lib (tags, configs, barrel, routes, skeleton, path alias); verified dry-run + real run + lint; invocation: `nx g ./tools/generators.json:feature-lib --name=reports` |
| Nx — custom executor | `tools/executors/affected-report/` + `tools/executors.json` + `tools/package.json` + `tools/project.json` | `nx run tools:affected-report`; Nx 24 resolves executors via local-plugin packages (ADR-9) |
| Nx — plugins | `nx.json` (`@nx/eslint`, `@nx/jest`, `@nx/playwright`, `@nx/webpack` plugin entries) | Inferred targets (`lint`, `test`, `e2e`, `build`/`serve`); `nx show project <name>` is the source of truth |
| Nx — tags + enforced boundaries | Every `project.json` (`tags`), root `eslint.config.mjs` (`depConstraints`) | Full table in README; the guard-relocation lesson in ADR-2 |
| Nx — migrations | [MIGRATIONS.md](./MIGRATIONS.md) | 2026-10-27 preview: already on latest (Nx 24.0.2), no migrations |
| Nx — distributed task execution | `ARCHITECTURE.md` ADR-8 | Explained (same task graph, sharded across machines via Nx Cloud); not run — needs Nx Cloud |
| Jest | All `*.spec.ts` (util 26 tests, data-access, ui, feature-planning, api `data.spec.ts`) | Real logic: projection math, validators, operator behavior, component rendering |
| Playwright | `apps/web-e2e/src/wealthdesk.spec.ts`, `apps/web-e2e/playwright.config.mts` | Login → dashboard net worth; planner flow (20-row projection table); chromium; API must run on :3333 first |
| Cypress pattern (docs only) | This row | Same flow-test ideas (page objects, critical-path flows) with a different runner. Deliberately NOT built: two e2e frameworks = maintenance without benefit (ADR-13) |
| Git | `git log` in the repo | Logical commits, not one dump: scaffold → domain/util → api → data-access → ui → features+shell → fixes → e2e → tools → Docker/CI → docs. Local commits only; no push (main agent handles GitHub) |
| DevOps / CI — Jenkins | `Jenkinsfile` | Declarative pipeline: checkout (fetch `origin/main`) → install → lint/test/build (affected) → show-affected + report artifact → e2e (chromium, API started/killed in the job). Authored, not executed (no Jenkins in the dev VM) |
| DevOps / CI — GitHub Actions | `.github/workflows/ci.yml` | `affected` job (fetch-depth 0, `nx-set-shas`, affected lint/test/build, report artifact) + `e2e` job (API boot + curl wait + chromium). Authored, not executed (no Actions runner here) |
| Docker | `apps/web/Dockerfile`, `apps/web/nginx.conf`, `api/Dockerfile`, `docker-compose.yml`, `.dockerignore` | Multi-stage (Node build → nginx; build+prune → slim runtime); compose web :8080 + api :3333. Authored, not built (no Docker in the dev VM) |

## Explicitly out of scope

| JD item | Status |
| --- | --- |
| Native mobile (JD "nice to have") | **Out of scope, by decision.** No mobile app is built. The web app is responsive by CSS but there is no native shell, no Capacitor/Cordova, no mobile-specific code. If asked, the honest answer is: the JD listed it as nice-to-have and this project covers the required surface instead. |
