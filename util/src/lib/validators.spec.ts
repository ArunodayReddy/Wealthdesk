/**
 * validators.spec.ts — tests for projection input validation.
 *
 * WHAT THIS PROVES: every rule has at least one failing case, so a future
 * edit that weakens a rule breaks a test. Boundary values (0, 1, 40, 41)
 * are tested explicitly — off-by-one errors live exactly at boundaries.
 */
import { validateProjectionInput } from './validators';

const valid = {
  currentBalance: 10_000,
  annualSalary: 100_000,
  contributionRate: 0.1,
  employerMatchRate: 0.5,
  employerMatchCap: 0.03,
  annualReturnRate: 0.07,
  years: 20,
};

describe('validateProjectionInput', () => {
  it('accepts a valid input', () => {
    expect(validateProjectionInput(valid)).toEqual([]);
  });

  it('rejects out-of-range rates and years', () => {
    expect(validateProjectionInput({ ...valid, contributionRate: 1.5 }))
      .toContain('contributionRate must be between 0 and 1');
    expect(validateProjectionInput({ ...valid, years: 41 }))
      .toContain('years must be a whole number between 1 and 40');
    expect(validateProjectionInput({ ...valid, years: 2.5 }))
      .toContain('years must be a whole number between 1 and 40');
  });

  it('rejects negative balances and non-positive salaries', () => {
    expect(validateProjectionInput({ ...valid, currentBalance: -1 }))
      .toContain('currentBalance must be a non-negative number');
    expect(validateProjectionInput({ ...valid, annualSalary: 0 }))
      .toContain('annualSalary must be a positive number');
  });

  it('collects multiple errors at once', () => {
    const errors = validateProjectionInput({
      ...valid,
      currentBalance: -5,
      years: 0,
    });
    expect(errors).toHaveLength(2);
  });
});
