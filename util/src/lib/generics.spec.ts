/**
 * generics.spec.ts — tests for the generic helpers.
 *
 * WHAT THIS PROVES: pluck is type-safe at compile time (a bad key fails
 * the BUILD, which is the test that matters most — try it: change
 * 'symbol' to 'ticker' below and watch tsc reject it), and groupBy buckets
 * correctly at runtime.
 */
import { groupBy, pluck } from './generics';

const holdings = [
  { symbol: 'AAPL', sector: 'Technology', shares: 10 },
  { symbol: 'MSFT', sector: 'Technology', shares: 5 },
  { symbol: 'JNJ', sector: 'Healthcare', shares: 8 },
];

describe('pluck', () => {
  it('extracts one field from every item', () => {
    expect(pluck(holdings, 'symbol')).toEqual(['AAPL', 'MSFT', 'JNJ']);
    expect(pluck(holdings, 'shares')).toEqual([10, 5, 8]);
  });
});

describe('groupBy', () => {
  it('buckets items by the key function', () => {
    const grouped = groupBy(holdings, (h) => h.sector);
    expect(Object.keys(grouped).sort()).toEqual(['Healthcare', 'Technology']);
    expect(grouped['Technology']).toHaveLength(2);
    expect(grouped['Healthcare'][0].symbol).toBe('JNJ');
  });

  it('returns an empty record for empty input', () => {
    expect(groupBy([], (h: { sector: string }) => h.sector)).toEqual({});
  });
});
