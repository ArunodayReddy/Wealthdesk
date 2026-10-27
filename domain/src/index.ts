/**
 * domain — public API of the shared domain lib.
 *
 * WHERE IT IS USED: every project that needs the shared vocabulary imports
 * from '@fidelity-portfolio-dashboard/domain' (the tsconfig path alias),
 * never from a deep relative path like '../../../domain/src/lib/models'.
 * The barrel file is the contract: if it isn't exported here, it isn't
 * public, and consumers must not reach around it.
 *
 * WHY IT EXISTS: one import path, one place to audit what the domain
 * promises. Renaming or removing an export is a visible breaking change.
 */
export * from './lib/models';
