/**
 * money.spec.ts — unit tests for money formatting.
 *
 * WHAT THIS PROVES: formatting is deterministic and locale-correct.
 * These are fast, dependency-free tests — the kind of suite you run on
 * every commit, because it costs milliseconds and catches regressions
 * before they reach a screen.
 */
import { formatCurrency, formatPercent, formatSignedPercent, roundToCents } from './money';

describe('roundToCents', () => {
  it('rounds half-cents up', () => {
    expect(roundToCents(10.005)).toBe(10.01);
  });
  it('leaves whole cents alone', () => {
    expect(roundToCents(42.1)).toBe(42.1);
  });
});

describe('formatCurrency', () => {
  it('formats with symbol, grouping, and two decimals', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatPercent / formatSignedPercent', () => {
  it('turns a fraction into a percent string', () => {
    expect(formatPercent(0.0714)).toBe('7.14%');
  });
  it('prefixes gains with +', () => {
    expect(formatSignedPercent(0.0142)).toBe('+1.42%');
    expect(formatSignedPercent(-0.02)).toBe('-2.00%');
  });
});
