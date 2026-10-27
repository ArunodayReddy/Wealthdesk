/**
 * projection.spec.ts — unit tests for the projection math.
 *
 * WHAT THIS PROVES, and why these specific cases:
 * - The employer-match CAP binds (not just the rate): with a 100% match
 *   rate but a 3%-of-salary cap, the match must stop at the cap. This is
 *   the case most hand-rolled implementations get wrong.
 * - Zero return still accumulates contributions + match (no growth term).
 * - Yearly rows chain: each year's startBalance equals the previous year's
 *   endBalance — a broken chain means the compounding is wrong.
 * - Totals equal the sum of the yearly rows (no rounding drift).
 */
import { computeProjection } from './projection';

const base = {
  currentBalance: 10_000,
  annualSalary: 100_000,
  contributionRate: 0.1,
  employerMatchRate: 0.5,
  employerMatchCap: 0.03,
  annualReturnRate: 0.07,
  years: 1,
};

describe('computeProjection', () => {
  it('caps the employer match at the salary cap, not the rate', () => {
    // Contribution 10,000; 50% match would be 5,000, but the cap is
    // 3% of salary = 3,000, so the match must be 3,000.
    const result = computeProjection({ ...base, employerMatchRate: 1 });
    expect(result.yearly[0].employerMatch).toBe(3000);
  });

  it('applies the uncapped match when under the cap', () => {
    const result = computeProjection(base);
    // Contribution 10,000 * 50% = 5,000... but cap is 3,000. Use a lower
    // rate to stay under the cap: 20% of 10,000 = 2,000 < 3,000.
    const underCap = computeProjection({ ...base, employerMatchRate: 0.2 });
    expect(underCap.yearly[0].employerMatch).toBe(2000);
    expect(result.yearly[0].employerMatch).toBe(3000);
  });

  it('chains yearly balances and sums totals without drift', () => {
    const result = computeProjection({ ...base, years: 5 });
    for (let i = 1; i < result.yearly.length; i++) {
      expect(result.yearly[i].startBalance).toBe(result.yearly[i - 1].endBalance);
    }
    const sum = (pick: (y: (typeof result.yearly)[number]) => number) =>
      result.yearly.reduce((acc, y) => acc + pick(y), 0);
    expect(result.totalContributions).toBeCloseTo(sum((y) => y.contributions), 2);
    expect(result.totalEmployerMatch).toBeCloseTo(sum((y) => y.employerMatch), 2);
    expect(result.totalGrowth).toBeCloseTo(sum((y) => y.growth), 2);
    expect(result.finalBalance).toBe(
      result.yearly[result.yearly.length - 1].endBalance,
    );
  });

  it('grows nothing with a zero return rate', () => {
    const result = computeProjection({ ...base, annualReturnRate: 0 });
    expect(result.yearly[0].growth).toBe(0);
    expect(result.finalBalance).toBe(10_000 + 10_000 + 3000);
  });
});
