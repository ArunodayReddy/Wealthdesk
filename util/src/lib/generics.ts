/**
 * generics.ts — TypeScript generics and utility types, with working examples.
 *
 * WHERE IT IS USED: groupBy powers the dashboard allocation breakdown
 * (holdings grouped by sector); pluck is a general-purpose helper used by
 * the tests and available to any consumer. The utility-type examples below
 * are the TYPE-level half of this file — they produce no runtime code, but
 * they are how you prove in an interview that you can shape types, not just
 * values.
 *
 * TEACHING NOTE — generics: a generic function is written ONCE and works
 * for many types while keeping full type safety. `pluck<T, K extends keyof T>`
 * says: "give me an array of T and a key K that MUST be a key of T, and I
 * will give you back an array of T[K]". The compiler rejects a bad key at
 * build time instead of returning undefined at runtime. That is the whole
 * value proposition of TypeScript in one sentence.
 */
import { Account, Holding } from '@fidelity-portfolio-dashboard/domain';

/**
 * Extract one field from every item. Type-safe: the key must exist on T.
 * Example: pluck(holdings, 'symbol') -> string[].
 */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

/**
 * Group items by a key function. Returns a Record from key -> items.
 * Example: groupBy(holdings, (h) => h.sector) -> Record<string, Holding[]>.
 * The dashboard allocation chart is computed from exactly this shape.
 */
export function groupBy<T>(items: readonly T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    // ??= creates the bucket on first sight, then appends. (Logical nullish
    // assignment: assign only when the left side is null or undefined.)
    (groups[key] ??= []).push(item);
  }
  return groups;
}

/**
 * UTILITY TYPES — these transform existing types instead of redeclaring them:
 *
 * Partial<T>      — every field optional. Used for PATCH-style updates.
 * Pick<T, K>      — only the named fields. Used for lean DTOs.
 * Omit<T, K>      — every field EXCEPT the named ones.
 * Record<K, V>    — an object keyed by K with values of V.
 * Readonly<T>     — every field readonly; the compiler blocks mutation.
 *
 * The examples below are real, compiled types (hover them in an editor):
 */
export type AccountUpdate = Partial<Account>;
export type HoldingIdentity = Pick<Holding, 'symbol' | 'accountId'>;
export type AccountWithoutBalance = Omit<Account, 'balance'>;
export type PriceMap = Record<string, number>;
export type FrozenAccount = Readonly<Account>;
