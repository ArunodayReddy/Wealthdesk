# LEARNING.md — Guided tour of WealthDesk

Read this in order. Each stop names the concept, points at the exact
code, says why it is that way, and gives you something to try. You learn
the most by breaking things at the try-it steps and watching the
tooling catch you — that is what the tooling is for.

Prerequisites: `npm ci --legacy-peer-deps` done, repo at
`~/workspace/fidelity-portfolio-dashboard/`.

---

## Stop 1 — See the whole system: the project graph

**Concept:** An Nx monorepo is a graph, not a folder list. Every project
is a node; every import is an edge. The graph is what `affected`,
caching, and boundaries all reason about.

**Code:** Run `npx nx show projects` (14 projects), then
`npx nx graph` (opens a browser visualization — click `web` and follow
its edges into the feature libs, then into data-access, ui, domain,
util).

**Why:** If you can't picture the graph, you can't reason about blast
radius. Every later stop is one node or edge of this picture.

**Try it:** `npx nx show project web` — read its targets. Notice most
targets aren't in `apps/web/project.json`: they are *inferred* by
plugins (see ARCHITECTURE.md ADR-11).

## Stop 2 — Shared types: the domain lib

**Concept:** DTOs (data transfer objects) — the shapes the API and the
UI agree on. One definition, imported by both sides, so they can't drift.

**Code:** `domain/src/lib/models.ts` — `Account`, `Holding`, `Quote`,
`WatchlistItem`, `ProjectionInput`, `ProjectionYear`, `ProjectionResult`,
`PagedResponse`, `ApiErrorBody`, `AllocationSlice`. Barrel:
`domain/src/index.ts`.

**Why:** The API returns `PagedResponse<Account>` and the frontend
renders `Account[]` from the same type. Change the shape in one place
and TypeScript flags every consumer. Note the money tradeoff in the
file header: dollar numbers with per-step cent rounding (readable for a
demo; real ledgers use integer cents).

**Try it:** Add a field to `Account` (e.g. `nickname: string`) and run
`npx nx build api` — watch the API's mock data fail type-check until
you add the field there too. Revert when done.

## Stop 3 — Pure functions: money, projection, validators

**Concept:** Pure functions (same input → same output, no side effects)
are the easiest code to test and the safest to share between client and
server.

**Code:** `util/src/lib/money.ts` (cent rounding, `Intl` formatting),
`util/src/lib/projection.ts` (`computeProjection`: contributions first,
then growth; employer match = `min(contribution × matchRate,
salary × matchCap)`; yearly cent rounding),
`util/src/lib/validators.ts` (`validateProjectionInput` → `string[]`).

**Why:** The projection math lives here — not in the API route, not in
the Angular form — so the API and the form both use it, and the tests
test it once. The validator returns a *list* of errors, not a thrown
exception, so the API can return all problems at once (400 with
details) instead of one at a time.

**Try it:** `npx nx test util` (22 tests). Then break one: change the
match formula to ignore the cap, run the tests, watch the cap-binds
case fail. Revert.

## Stop 4 — The event loop, runnable: microtasks vs macrotasks

**Concept:** JavaScript runs one thing at a time. Synchronous code,
microtasks (promises, `queueMicrotask`), and macrotasks (`setTimeout`)
run in a strict order — and that order explains half of all async bugs.

**Code:** `util/src/lib/event-loop.ts` — `runEventLoopDemo()` with
teaching comments, plus the callback (`doubleWithCallback`, error-first)
and promise (`doubleWithPromise`) versions of the same operation, and a
closure counter (`createCounter`).

**Why:** The demo exists because the JD names the event loop
explicitly, and reading about it is not the same as watching it.
The test pins the real order — including the non-obvious fact that a
`queueMicrotask` enqueued *first* runs before a `promise.then`
enqueued second (FIFO within the microtask queue).

**Try it:** `npx nx test util -t event-loop` (or the full util suite).
Then reorder two lines in the demo and predict the new output before
running the test. If your prediction is wrong, the test tells you why.

## Stop 5 — Generics + utility types

**Concept:** Generics let one function work for many types without
losing type safety; utility types (`Partial`, `Pick`, `Omit`, `Record`,
`Readonly`) reshape types without rewriting them.

**Code:** `util/src/lib/generics.ts` — `pluck` (extract one field from
every item), `groupBy` (used by the allocation computation), and
utility-type examples with comments on when each fits.

**Why:** `groupBy` is the real payoff: the dashboard's allocation bar
groups holdings by sector with one generic call, not a hand-rolled loop
per grouping. Generics are not abstraction for its own sake — they are
how you write the loop once.

**Try it:** In a scratch test, call `pluck(accounts, 'name')` and
`pluck(accounts, 'nope')` — the second fails type-check. That failure
*is* the feature.

## Stop 6 — The API: Express, routes, errors, pagination

**Concept:** REST done properly: resource routes, versioned prefix,
pagination envelope, JSON errors, proper status codes, validation on
the server regardless of what the client checked.

**Code:** `api/src/routes.ts` (all `/api/v1` routes), `api/src/data.ts`
(mock universe + tick random walk), `api/src/errors.ts` (`ApiError`,
`notFound`, `badRequest`, `toErrorBody`), `api/src/main.ts`
(middleware order: json → router → 404 → error handler).

**Why:** Middleware order is the whole game in Express: the 404 handler
must sit *after* the router, the error handler must take four arguments
or Express won't treat it as an error handler, and handlers are
deliberately synchronous (Express 4 doesn't catch async rejections).
Pagination (`?page=&pageSize=`) keeps the accounts list bounded; the
`PagedResponse` envelope tells the client the total pages so it can
clamp its pager.

**Try it:** Start the API (`npx nx build api && node dist/api/main.js`)
and curl: paged accounts, a holdings list, a quote tick twice (watch
the price walk), a bad projection (400 with details), an unknown route
(404 JSON). All six are in the spec header comments — run them.

## Stop 7 — HTTP client + interceptors

**Concept:** One place owns HTTP; interceptors form a pipeline every
request flows through.

**Code:** `data-access/src/lib/api-client.ts` (thin `HttpClient` wrapper,
relative `/api/v1` base — same-origin by design),
`data-access/src/lib/interceptors.ts` (functional `authInterceptor`
attaches the demo token; `errorInterceptor` normalizes failures to
`Error` with the server's message).

**Why:** Interceptors are registered once in `app.config.ts`, in order:
auth first (attach token), error second (normalize failures). Requests
are immutable — interceptors `clone()` before modifying, so the
original request object is never mutated mid-flight. The cold-observable
note in `api-client.ts` matters: `HttpClient` returns cold observables
— nothing happens until subscribed, which is why stores subscribe and
components don't.

**Try it:** Open devtools on the dashboard, watch `/api/v1` requests
carry no `Authorization` header before login and one after (demo token
— inspect `auth.service.ts` to see why it's demo-only).

## Stop 8 — Signals, computed, and the store

**Concept:** Signals are reactive values; `computed` derives new values
from them; the store owns writes so reads stay consistent.

**Code:** `data-access/src/lib/accounts.store.ts` — signals
(`accounts`, `allHoldings`, `selectedAccountId`, `quotes`, `loading`,
`error`, `page`) and computed values (`netWorth`, `selectedHoldings`,
`allocation`). The quote poller is a single pipeline driven by a
`quoteSymbols` signal: change the symbols and `switchMap` tears down
the old timer and starts a new one.

**Why:** The dashboard never fetches — it reads `store.netWorth()` and
renders. `computed` caches: net worth recalculates only when holdings
change, not on every change-detection cycle. The signal-driven poller
is the design lesson: state drives effects, not imperative calls, so
polling can never be started twice or left on stale symbols.

**Try it (the boundary break):** In `ui/src/lib/stat-card.component.ts`,
add `import { AccountsStore } from '@fidelity-portfolio-dashboard/data-access';`
and run `npx nx lint ui` — the boundary rule fails (ui may not depend
on data-access). Remove the import; lint passes. That failure is the
architecture working.

## Stop 9 — RxJS, operator by operator, with the right use case each

**Concept:** Four flattening operators, four different promises about
concurrency. Using the wrong one is a real bug, not a style issue.

**Code + use cases:**

| Operator | Where | Why this one |
| --- | --- | --- |
| `switchMap` | `accounts.store.ts` polling; `watchlist.service.ts` search | New value cancels the old: a new poll cycle or keystroke abandons the in-flight request |
| `mergeMap` | `accounts.store.ts` `refreshAllHoldings` (concurrency 3) | Holdings for many accounts load concurrently, bounded so the API isn't hammered |
| `concatMap` | `watchlist.service.ts` add queue | Adds execute in order, one at a time — a queue must not reorder |
| `exhaustMap` | `planning.service.ts` submit pipeline | While a projection is in flight, further submits are dropped — double-click protection |

Plus `debounceTime(300)` + `distinctUntilChanged()` before the search
`switchMap` (don't search on every keystroke; don't re-search the same
text), and `catchError(() => EMPTY)` keeping the submit stream alive
after a failure.

**Why:** Each operator is a sentence about concurrency. If you can say
the sentence ("cancel the old one," "run three at once," "in order,"
"ignore while busy"), you can pick the operator — and defend it in an
interview.

**Try it:** `npx nx test data-access` — the planning spec proves
exhaustMap (double-submit → exactly 1 request; post-flush submit →
2nd request). Then change `exhaustMap` to `switchMap` in the spec's
service copy and watch the double-submit test fail.

## Stop 10 — Dumb components: OnPush, inputs, outputs, trackBy

**Concept:** Presentational ("dumb") components take inputs, emit
outputs, and know nothing about where data came from. OnPush means
"re-render only when inputs change (by reference) or an event fires."

**Code:** `ui/src/lib/` — `stat-card`, `holding-table` (`@for ... track
h.symbol`, `output() rowClicked`), `allocation-bar` (CSS stacked bars
— deliberately no chart library), `quote-ticker` (note: `Quote.
changePercent` is already a percent number like 1.42, not a fraction —
unlike the holding-table gain, which is a fraction; the file says so).

**Why:** OnPush + immutable signal updates (the store always `.set()`s
a new array) is the performance story: reference change → re-render;
no change → skip. `trackBy` (`track h.symbol`) stops Angular
rebuilding every table row when one price ticks. The allocation bar
with plain CSS is a scope decision: a chart library for four bars is
dependency weight without benefit.

**Try it:** `npx nx test ui`. Then remove `track` from the holding
table's `@for` and re-run — tests still pass (it's a perf property,
not a correctness one), which is itself the lesson: some quality
attributes aren't testable, they're reviewable.

## Stop 11 — Smart containers, lazy routes, guards

**Concept:** Features are smart containers (own data flow, render dumb
components); routes lazy-load them; guards protect them.

**Code:** `feature-dashboard/src/lib/dashboard.component.ts` (the
`effect()` that loads holdings once accounts arrive),
`feature-planning/src/lib/planner.component.ts` (reactive form +
form-level validator reusing the shared pure rules),
`feature-watchlist/src/lib/watchlist.component.ts` (thin wiring),
`feature-auth/src/lib/login.component.ts`,
`apps/web/src/app/app.routes.ts` (`loadChildren` per feature),
`apps/web/src/app/auth.guard.ts` (functional guard, UrlTree redirect).

**Why:** The container/presentational split is what makes both halves
testable: the planner's validator is unit-tested without rendering
(`feature-planning/src/lib/planner.component.spec.ts` — no TestBed
needed for a `FormBuilder` group). Lazy routes split the bundle (the
`nx build web` output shows one chunk per feature). The guard lives in
the app shell, not the feature, because Nx forbids statically importing
a lazy-loaded library (ADR-2).

**Try it:** `npx nx build web` and read the chunk list in the output —
one chunk per feature proves the split. Then visit `/dashboard` logged
out and watch the guard redirect to `/login` before any dashboard code
loads (network tab: no dashboard chunk fetched).

## Stop 12 — The shell: config, interceptors, proxy

**Concept:** The root component is chrome (header, nav, outlet); the
config wires the framework pieces; the proxy keeps the browser
same-origin.

**Code:** `apps/web/src/app/app.ts` (shell),
`apps/web/src/app/app.config.ts` (router, HttpClient + interceptors,
hydration), `apps/web/proxy.conf.json` (`/api` → `localhost:3333`),
`apps/web/project.json` (`proxyConfig` on the serve target),
`apps/web/nginx.conf` (the production twin of the proxy).

**Why:** Interceptor order is registered here, once, globally — not
per feature. The proxy exists so the API needs no CORS: dev and prod
both terminate `/api` on the same origin as the SPA.

**Try it:** `npx nx serve web` (with the API running) and open
http://localhost:4200. Log in, visit each route, watch the network tab:
lazy chunks load per route, `/api/v1` calls go to :4200 and arrive at
:3333.

## Stop 13 — Affected: change one lib, see the blast radius

**Concept:** The project graph + git changes = the affected set. CI
runs only that set.

**Code:** `tools/executors/affected-report/executor.ts` (runs
`nx show projects --affected`, writes markdown),
`tools/project.json` (`tools:affected-report` target).

**Why:** This is the monorepo payoff in one command: a one-line util
change doesn't rebuild the world, and the report proves what ran and
why.

**Try it:** Change one line in `util/src/lib/money.ts` (don't commit),
then run `npx nx run tools:affected-report` and read
`affected-report.md` — `util` plus everything downstream (api,
data-access, features, web) is listed; unrelated projects aren't.
Revert the change. (The report file is gitignored; regenerate anytime.)

## Stop 14 — Caching: run it twice

**Concept:** Nx hashes task inputs; unchanged tasks replay from cache.

**Code:** `nx.json` (`targetDefaults` + `namedInputs`: the `production`
input set excludes specs and configs from build hashes).

**Why:** The second identical build should do almost no work. Cache
correctness is the subtle part: if a task's inputs miss a file it
reads, the cache lies. The `production` input set exists to draw that
line deliberately (source in, specs out).

**Try it:** `npx nx build web` twice in a row. The second run reports
cache hits for the dependency tasks. Then touch `ui/src/lib/` and build
again — the app rebuilds (its inputs changed) while untouched libs stay
cached.

## Stop 15 — Generate a feature, then delete it

**Concept:** Custom generators encode conventions so new code starts
compliant.

**Code:** `tools/generators/feature-lib/` (generator, schema, templates),
`tools/generators.json` (the Nx 24 collection file),
`.nxignore` (hides the template `project.json` from discovery).

**Why:** The generator writes the project.json (tags included), the
tsconfigs, the jest/eslint configs, the barrel, the skeleton component
+ routes, and the tsconfig path entry — the six things a hand-copied
lib gets wrong. The Nx 24 discovery lessons (collection path, factory
file path, `.nxignore` phantom) are in ADR-9 — read them before you
debug any generator issue.

**Try it:** `npx nx g ./tools/generators.json:feature-lib --name=reports
--dry-run` (read the CREATE list), then run it for real, run
`npx nx lint feature-reports`, then delete `feature-reports/` and
remove its tsconfig path entry. The dry-run-first habit is the point.

## Stop 16 — E2E: the critical flows, for real

**Concept:** Unit tests prove logic; e2e proves the wired system (auth
→ guard → lazy route → store → API → render).

**Code:** `apps/web-e2e/src/wealthdesk.spec.ts`, `apps/web-e2e/
playwright.config.mts` (dev server + proxy; API must already run).

**Why:** The planner e2e test fills the real form, submits, and counts
20 table rows — it exercises the validator, the exhaustMap pipeline,
the API projection, and the rendering in one pass. Cypress is not
built (ADR-13): same flow-test ideas, one runner.

**Try it:** API running, then
`cd apps/web-e2e && npx playwright test --project=chromium`
(2 tests). Break the planner (e.g. point the form at a wrong field
name) and watch the e2e fail where unit tests pass — that's the gap
e2e exists to close. Revert.

## Stop 17 — Ship it: Docker + CI

**Concept:** The same topology (SPA + API, same-origin `/api`) in three
places: dev proxy, nginx container, CI jobs.

**Code:** `apps/web/Dockerfile` (Node build → nginx),
`apps/web/nginx.conf` (SPA fallback + `/api` proxy),
`api/Dockerfile` (build + prune → slim runtime),
`docker-compose.yml` (web :8080 + api :3333),
`Jenkinsfile`, `.github/workflows/ci.yml` (both `nx affected` stages).

**Why:** Multi-stage builds keep secrets and dev deps out of runtime
images; the pruned api image installs exactly one production dep
(express). CI runs affected, not everything — and writes the affected
report as an artifact so a reviewer can audit what ran.

**Try it (reading only, no Docker in this VM):** Read the Dockerfiles
against the real dist layouts (`dist/apps/web/browser`,
`dist/api/main.js` + pruned `package.json`). Confirm every COPY source
exists in a fresh build. That check is the substitute for running
`docker build` here — and it's honest about being a substitute.

## Stop 18 — Staying current: migrations

**Concept:** Upgrades are a workflow (`nx migrate`), not version edits.

**Code:** [MIGRATIONS.md](./MIGRATIONS.md) — the 2026-10-27 preview
result (already on latest, Nx 24.0.2, no migrations) and the procedure.

**Try it:** `npx nx migrate latest` (read-only when nothing is newer —
it reports "No updates were applied" and changes nothing). When it
does find updates, read `migrations.json` before running anything.

---

## Interview cheat-sheet (one line each)

- **Signals vs NgRx:** signals + computed for derived state; RxJS only
  where streams earn it; NgRx when state surface grows 10×.
- **switchMap / mergeMap / concatMap / exhaustMap:** cancel / concurrent
  bounded / ordered / ignore-while-busy.
- **OnPush:** re-render on input reference change or events; stores
  `.set()` new arrays, never mutate.
- **Lazy routes:** `loadChildren` = webpack code-split point; guard on
  the parent runs before the chunk loads.
- **Boundaries:** tags + depConstraints; ui never imports data-access;
  guards live in the shell, not lazy features.
- **Affected:** graph + git = the set CI runs; cache makes repeats free.
- **Why no federation:** one team, one release train — lazy routes give
  the bundle win without runtime versioning risk.
- **Why REST not GraphQL:** one client, fixed screens, no over-fetching
  problem; versioned prefix keeps the door open.
