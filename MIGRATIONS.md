# MIGRATIONS.md — Nx / Angular upgrade notes

## How upgrades work in this repo

Upgrades go through `nx migrate`, never by hand-editing versions:

```sh
npx nx migrate latest        # 1. compute updates, rewrite package.json, write migrations.json
git diff package.json          # 2. READ what would change before accepting it
npx nx migrate --run-migrations   # 3. run the codemods in migrations.json
npx nx run-many -t lint test build  # 4. verify everything before committing
```

`nx migrate` updates `package.json` (and the lockfile, via an install)
and writes `migrations.json` — a list of codemod generators to run.
`--run-migrations` executes them. Commit the upgrade only after step 4
is green. Never commit a half-migrated state.

## Preview run — 2026-10-27 (no changes made)

Command: `npx nx migrate latest`

Result: **no updates were applied — no package updates or migrations
were found.** The migrator fetched metadata for the installed line
(`nx@24.0.2`, `@nx/angular@24.0.2`, `@nx/eslint@24.0.2`,
`@nx/webpack@24.0.2`, `@nx/devkit@24.0.2`, `@nx/workspace@24.0.2`,
`@nx/js@24.0.2`, `@nx/eslint-plugin@24.0.2`, `@nx/web@24.0.2`,
`@nx/playwright@24.0.2`, `@nx/express@24.0.2`, `@nx/jest@24.0.2`,
`@nx/node@24.0.2`) and concluded the workspace is already on latest.
No `migrations.json` was created; `package.json` and
`package-lock.json` are untouched (verified via `git status`).

Interpretation: at the time of writing, Nx 24.0.2 is the current latest
line for these packages. When a newer major/minor lands, the same
command will produce a real `migrations.json` — read it before running
it, especially any migration touching the webpack builder or the
Angular version (see ARCHITECTURE.md ADR-10 for why the webpack builder
is a deliberate choice that a migration might try to change).

## Known future migration pressure

- **Angular build system:** the dev server warns that the webpack
  builder is deprecated in favor of `@angular/build`. A future `nx
  migrate` may offer that switch. It is safe to take when the JD no
  longer names Webpack — until then, keep the webpack builder and
  accept the warning.
- **Nx 24 workspace generators/executors:** the local-plugin collection
  mechanism (`tools/generators.json`, `tools/executors.json`) is the Nx
  24 way. A major Nx upgrade may change plugin resolution — re-run the
  generator dry-run and the executor after any major upgrade to confirm
  they still resolve (see ARCHITECTURE.md ADR-9 for the failure modes).
