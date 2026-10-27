# ARCHITECTURE.md — WealthDesk decision records

Short ADRs (Architecture Decision Records) for the big calls. Each one:
context, decision, consequences. Read with [LEARNING.md](./LEARNING.md),
which walks the same decisions in code order.

Status key: **Accepted** (in force), **Noted** (deliberate non-choice).

---

## ADR-1 — Nx monorepo, package-based layout with libs at the root

**Status:** Accepted.

**Context:** The app has two runtimes (Angular web, Express API) and five
kinds of shared code. A single-repo layout must keep those kinds from
tangling while letting the app import libs by package name.

**Decision:** One Nx workspace, Nx 24 package-based layout: `apps/web`,
`api/` (the Express app, generated as `apps/api` by the scaffold and kept
at the root by Nx 24's layout), and libraries as root-level packages
(`domain/`, `util/`, `data-access/`, `ui/`, `feature-*/`). Imports use
tsconfig path aliases (`@fidelity-portfolio-dashboard/<lib>` →
`./<lib>/src/index.ts`), and every lib is consumed through its barrel
(`src/index.ts`) — never deep imports.

**Consequences:** `nx show projects` lists 14 projects; `nx graph`
renders the real dependency graph. Root-level libs read slightly
unconventionally to developers used to `libs/`, but it is Nx 24's
default and it makes each lib an independently addressable package.

## ADR-2 — Enforced module boundaries via tags + depConstraints

**Status:** Accepted.

**Context:** Without enforcement, "split by kind" rots: a presentational
component starts importing a store, a feature starts importing another
feature, and the layering becomes fiction.

**Decision:** Every project carries Nx tags (`scope:web|server|shared`,
`type:app|feature|data-access|ui|domain|util`), and the root
`eslint.config.mjs` enforces `enforce-module-boundaries` with
`depConstraints` (see README for the table) plus
`enforceBuildableLibDependency: true`.

**Consequences — two findings worth knowing for interviews:**

1. **Guards can't live in lazy features.** `nx lint web` failed with
   "Static imports of lazy-loaded libraries are forbidden" because the
   route table statically imported `authGuard` from `feature-auth` while
   also lazy-loading it. The guard moved into the app shell
   (`apps/web/src/app/auth.guard.ts`); the feature stays purely lazy.
2. **Source-consumed libs pass the buildable check.** Nx 24 Angular libs
   ship with no `build` target — the app builder compiles them from
   source via tsconfig paths. With `enforceBuildableLibDependency: true`,
   `nx lint web` still passes: the rule does not demand ng-packagr
   (publishable) builds for app-internal libs. No rule weakening was
   needed; the finding was verified empirically, not assumed.

**Try it:** break a boundary (import a store into `ui/`) and watch
`nx lint ui` fail; revert. See LEARNING.md stop 8.

## ADR-3 — Signals + signal stores, not NgRx

**Status:** Accepted.

**Context:** The app needs shared, reactive state (accounts, holdings,
quotes, watchlist) with derived values (net worth, allocation) and
async pipelines (polling, search, submits).

**Decision:** Angular signals (`signal`, `computed`) plus hand-written
signal stores (`AccountsStore`), and RxJS only where streams are the
right tool (HTTP, polling, debounced search, submit pipelines). No NgRx.

**Consequences:** No actions/reducers/effects boilerplate for state that
is just "load data, derive views." `computed` replaces selectors
(net worth, allocation, selected holdings are pure derivations).
RxJS stays where it earns its place: `switchMap` polling and search,
`mergeMap` concurrent holdings refresh, `concatMap` ordered watchlist
adds, `exhaustMap` submit deduplication. The tradeoff is discipline:
stores are hand-rolled, so their invariants (e.g. "only the store writes
its signals") are conventions enforced by code review, not by a
framework. For an app this size that is the right trade; at 10× the
state surface, NgRx's structure would win.

## ADR-4 — Module federation NOT used

**Status:** Accepted (deliberate non-choice).

**Context:** Nx + webpack make module federation easy, and "micro
frontends" is a fashionable answer to "how do we scale a frontend team."

**Decision:** Not used. One SPA, one deployable, lazy routes for code
splitting.

**Consequences:** Federation buys independent deployment per remote at
the cost of versioning contracts between remotes, shared-dependency
negotiation, and runtime failure modes (a remote failing to load is a
production incident shape this app doesn't need). With one team and one
release train, lazy-loaded routes give the same initial-bundle win
without the distributed-systems cost. If WealthDesk ever grew a second
team shipping a second app on a separate cadence, federation would be
revisited — and the feature-lib boundaries in ADR-2 are exactly the
seams remotes would split along.

## ADR-5 — Mock-data boundary: simulated, labeled, server-side

**Status:** Accepted.

**Context:** A portfolio app needs market data, but there is no real feed
and inventing a Fidelity integration would be dishonest.

**Decision:** All data is mock, generated server-side in `api/src/data.ts`
(fixed universe of 8 symbols, 5 accounts, 10 holdings; quotes random-walk
±0.5% per tick clamped ±5% of base). The UI labels it mock (footer on
every page, "MOCK DATA" in docs). The API is the boundary: the frontend
never fabricates prices; it only renders what the API returns.

**Consequences:** The app is honest and demoable without credentials,
and the boundary is clean — swapping `data.ts` for a real feed later
touches one file, not the UI. The cost is realism: no real quotes,
no persistence (in-memory watchlist resets on restart).

## ADR-6 — REST, versioned, with service boundaries

**Status:** Accepted.

**Context:** The JD asks for REST API design and microservices thinking;
GraphQL is the obvious alternative.

**Decision:** REST under `/api/v1` (versioned from day one), resource
routes (`/accounts`, `/accounts/:id/holdings`, `/quotes`,
`/quotes/search`, `/watchlist`, `/projection`), pagination
(`?page=&pageSize=`, `PagedResponse` envelope), typed DTOs shared from
`domain/`, JSON error bodies (`ApiErrorBody`) with proper status codes
(400 validation, 404 unknown route/id), and server-side validation that
re-runs the same pure rules the client runs (client checks are UX;
server checks are the contract).

**Consequences:** Versioning (`/v1`) lets a future `/v2` coexist instead
of breaking clients. The API is one deployable today, but its routes are
already service-shaped: accounts, quotes, and projection could split
into separate services behind the same `/api/v1` prefix without the
frontend changing — that is the microservices thinking the JD names,
applied at the seam where it matters. GraphQL was rejected for this
scope: one client, fixed screens, no over-fetching problem to solve,
and REST's cacheability + curl-debuggability wins for a learning
project. See ADR-5 for why the data behind the API is mock.

## ADR-7 — Nx affected: the project graph drives CI

**Status:** Accepted.

**Context:** Full lint/test/build on every change wastes CI minutes and
teaches nothing; the graph knows exactly what a change touches.

**Decision:** CI stages run `nx affected -t lint test build`
(Jenkinsfile, `.github/workflows/ci.yml`), and the custom
`tools:affected-report` executor writes a markdown report of affected
projects for auditability.

**Consequences:** A change to `util/` rebuilds/retests `util` +
everything that depends on it (api, data-access, features, web) and
skips the rest. Affected needs git history: CI checks out with
`fetch-depth: 0` (GitHub) or fetches `origin/main` (Jenkins). Verified
locally: `nx run tools:affected-report` listed the touched projects
after uncommitted changes (see LEARNING.md stop 9 for the demo).

## ADR-8 — Computation caching: local cache now, Nx Cloud later

**Status:** Accepted (local); Noted (remote/DTE).

**Context:** Rebuilding unchanged projects on every run is the
slowest tax in a monorepo.

**Decision:** Nx's local computation cache is on (default): task inputs
are hashed (project files + dependency outputs via the `production`
named inputs in `nx.json`), and unchanged tasks replay from cache.
Remote caching (Nx Cloud) and distributed task execution (DTE) are
documented but NOT run here — both need Nx Cloud, which needs an
account and a token this repo doesn't have.

**Consequences:** Second runs are visibly faster (verified: a repeat
`nx build web` reported cache hits for its dependency tasks). The
interview line: "local cache is free and on by default; remote cache
shares it across machines and CI; DTE shards the affected task graph
across agents — same graph, more machines." DTE changes nothing about
how tasks are defined; it changes where they run.

## ADR-9 — Custom generator + executor encode team conventions

**Status:** Accepted.

**Context:** Built-in generators don't know this repo's conventions
(root-level layout, `scope:web/type:feature` tags, barrel + routes +
skeleton shape, tsconfig path entry). Hand-copying a lib to start a
feature invites drift.

**Decision:** `tools/generators/feature-lib` scaffolds a feature lib
from templates and registers its path alias; `tools/executors/
affected-report` wraps `nx show projects --affected` as a first-class
target. Both are registered as Nx 24 local-plugin collections
(`tools/generators.json`, `tools/executors.json` +
`tools/package.json`), invoked as
`nx g ./tools/generators.json:feature-lib` and
`nx run tools:affected-report`.

**Consequences — three Nx 24 lessons baked in:**

1. **Generators resolve via a collection file.** Bare
   `nx g feature-lib` does not discover `tools/generators/`; the
   collection path (`./tools/generators.json:feature-lib`) does, and
   the factory must point at the file (`.../generator`), not the
   directory (directory resolution misses `index.ts`).
2. **Executors resolve via a package.** The executor string is
   `<package>:<executor>`, and the package must be a local plugin:
   `tools/package.json` (name `@fidelity-portfolio-dashboard/tools`,
   `executors` field) plus a tsconfig path mapping the package name
   into the tools project root — without that mapping, Nx reports
   "Cannot find module '@.../tools/package.json'".
3. **Template files must be hidden from project discovery.** The
   generator's template `project.json` registered a phantom project
   literally named `feature-<%= fileName %>` until `.nxignore`
   excluded the templates directory. (The `.tmpl` suffix convention
   does not strip in this devkit version — verified, not assumed.)

## ADR-10 — Webpack builder + SSR retained from the scaffold

**Status:** Accepted.

**Context:** The JD names Webpack explicitly; Angular's new build system
(esbuild-based) is the default direction and the dev server prints a
deprecation warning for the webpack builder.

**Decision:** Keep the scaffold's `@angular-devkit/build-angular`
(webpack) builder for web, and keep the scaffold's SSR server
(`apps/web/server.ts`, `app.config.server.ts`) for dev.

**Consequences:** The webpack builder is the honest JD answer (lazy
chunks, `loadChildren` code-split points, and the build output in
`dist/apps/web/browser` are all webpack behavior). The deprecation
warning is noise, not breakage — but a future migration to
`@angular/build` is a known, small step. SSR is retained for dev only:
the Docker image serves the SPA build (SSR needs a Node runtime the
nginx image doesn't have); prerender/serve-ssr targets still exist for
anyone who wants them.

## ADR-11 — Plugin inference for targets, explicit config for the rest

**Status:** Accepted.

**Context:** Hand-writing lint/test/build targets for 14 projects is
busywork that drifts.

**Decision:** `nx.json` registers plugins that infer targets:
`@nx/eslint/plugin` → `lint`, `@nx/jest/plugin` → `test` (excluding
`api-e2e`), `@nx/playwright/plugin` → `e2e`, `@nx/webpack/plugin` →
`build`/`serve`/`preview`. `project.json` files stay minimal (name,
tags, sourceRoot) with explicit targets only where inference doesn't
cover the need (api's `prune`/`serve`, web's `serve-static`/`server`,
tools' `affected-report`).

**Consequences:** `nx show project <name>` is the source of truth for
what a project can do. The tradeoff: inferred targets are invisible in
`project.json`, so newcomers must learn `nx show` — documented in
README and LEARNING.md.

## ADR-12 — Migrations: stay on latest, verify before upgrading

**Status:** Accepted.

**Context:** Nx and Angular ship breaking changes; blind upgrades break
builds.

**Decision:** Upgrades go through `nx migrate` (preview, apply,
run migrations, verify), never by hand-editing versions. The workflow
is documented in [MIGRATIONS.md](./MIGRATIONS.md).

**Consequences:** The 2026-10-27 preview run found the workspace
already on latest (Nx 24.0.2 across all `@nx/*` packages) — no
migrations, nothing changed. The discipline matters more than the
outcome: migrate, read `migrations.json`, run the codemods, then
`lint test build` everything before committing.

## ADR-13 — Testing: Jest for logic, Playwright for flows, Cypress in docs only

**Status:** Accepted.

**Context:** The JD names Jest + Playwright and mentions Cypress as a
pattern. Two e2e frameworks in one repo is maintenance without benefit.

**Decision:** Jest (via `jest-preset-angular`, zoneless test env) for
unit tests of real logic: projection math, money formatting, validators,
form-level validation, RxJS operator behavior (exhaustMap
double-submit, mergeMap concurrency), and UI component rendering.
Playwright (chromium) for the critical e2e flows: login → dashboard,
planner submit → projection table. Cypress is documented as a pattern
in [JD_COVERAGE.md](./JD_COVERAGE.md) — same page-object / flow-test
ideas, different runner — and deliberately not built.

**Consequences:** Unit tests run in seconds per lib (`nx test <lib>`);
e2e needs the API running (documented in the spec header and CI). The
e2e spec runs against the dev server + proxy, not the production nginx
image — the proxy topology is identical, the server differs, and that
gap is stated honestly in README.
