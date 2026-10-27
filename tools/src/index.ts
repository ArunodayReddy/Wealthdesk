/**
 * tools/src/index.ts — the tools package barrel.
 *
 * WHY THIS FILE EXISTS: Nx 24 resolves local plugin packages (for the
 * custom executor) by matching the package name against tsconfig.base.json
 * paths — `@fidelity-portfolio-dashboard/tools` must map to a file inside
 * this project, or `nx run tools:affected-report` fails with "Cannot find
 * module '@fidelity-portfolio-dashboard/tools/package.json'". The path
 * entry lives in tsconfig.base.json; this barrel gives it a real target
 * and re-exports the tools' public types for anyone extending them.
 */
export type { FeatureLibGeneratorSchema } from '../generators/feature-lib/schema';
export type { AffectedReportExecutorSchema } from '../executors/affected-report/schema';
