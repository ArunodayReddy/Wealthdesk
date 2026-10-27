/**
 * data.spec.ts — invariants of the mock dataset.
 *
 * WHAT THIS PROVES: the demo data is internally consistent, so a UI bug is
 * never secretly a data bug. Rules pinned here:
 * - Every holding's symbol exists in the tradeable universe.
 * - Every holding belongs to a real account.
 * - No duplicate (accountId, symbol) position rows.
 * - Every account id is unique.
 * If someone edits data.ts carelessly, this spec fails first, loudly.
 */
import { ACCOUNTS, HOLDINGS, SYMBOL_UNIVERSE } from './data';

describe('mock data invariants', () => {
  it('has unique account ids', () => {
    const ids = ACCOUNTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it('references only known symbols and real accounts', () => {
    const symbols = new Set(SYMBOL_UNIVERSE.map((s) => s.symbol));
    const accountIds = new Set(ACCOUNTS.map((a) => a.id));
    for (const h of HOLDINGS) {
      expect(symbols.has(h.symbol)).toBe(true);
      expect(accountIds.has(h.accountId)).toBe(true);
      expect(h.shares).toBeGreaterThan(0);
      expect(h.avgCost).toBeGreaterThan(0);
    }
  });

  it('has no duplicate (accountId, symbol) positions', () => {
    const keys = HOLDINGS.map((h) => `${h.accountId}:${h.symbol}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
