/**
 * validators.ts — pure validation for projection input.
 *
 * WHERE IT IS USED: the API calls validateProjectionInput and returns 400
 * with the error list when input is bad; the Angular planner form reuses
 * the same rules client-side for instant feedback (wrapped as an Angular
 * validator in feature-planning). One rule set, two enforcement points —
 * and the server is always the authority, because client checks can be
 * bypassed.
 *
 * WHY PURE FUNCTIONS: validation here has no Angular dependency, so it is
 * importable by the Express server AND unit-testable without TestBed.
 * Framework-free logic in util, framework glue in feature libs — that split
 * is the architecture working as designed.
 */
import { ProjectionInput } from '@fidelity-portfolio-dashboard/domain';

/** Returns a list of human-readable problems; empty means valid. */
export function validateProjectionInput(input: ProjectionInput): string[] {
  const errors: string[] = [];
  const isFiniteNumber = (n: unknown): n is number =>
    typeof n === 'number' && Number.isFinite(n);

  if (!isFiniteNumber(input.currentBalance) || input.currentBalance < 0) {
    errors.push('currentBalance must be a non-negative number');
  }
  if (!isFiniteNumber(input.annualSalary) || input.annualSalary <= 0) {
    errors.push('annualSalary must be a positive number');
  }
  if (
    !isFiniteNumber(input.contributionRate) ||
    input.contributionRate < 0 ||
    input.contributionRate > 1
  ) {
    errors.push('contributionRate must be between 0 and 1');
  }
  if (
    !isFiniteNumber(input.employerMatchRate) ||
    input.employerMatchRate < 0
  ) {
    errors.push('employerMatchRate must be non-negative');
  }
  if (
    !isFiniteNumber(input.employerMatchCap) ||
    input.employerMatchCap < 0 ||
    input.employerMatchCap > 1
  ) {
    errors.push('employerMatchCap must be between 0 and 1');
  }
  if (
    !isFiniteNumber(input.annualReturnRate) ||
    input.annualReturnRate < -1
  ) {
    errors.push('annualReturnRate must be greater than -1');
  }
  if (
    !Number.isInteger(input.years) ||
    input.years < 1 ||
    input.years > 40
  ) {
    errors.push('years must be a whole number between 1 and 40');
  }
  return errors;
}
