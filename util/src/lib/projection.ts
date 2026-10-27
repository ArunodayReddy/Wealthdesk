/**
 * projection.ts — the 401(k)-style contribution projection math.
 *
 * WHERE IT IS USED: the API's POST /api/v1/projection endpoint (server-side
 * computation — the client never trusts its own math for a "result") AND the
 * unit tests. The Angular planner form only COLLECTS input and DISPLAYS the
 * API's answer. One implementation, shared by server and tests: if the math
 * changes, it changes in exactly one place.
 *
 * WHY IT EXISTS: projection math is pure business logic — no DOM, no HTTP,
 * no framework. Pure functions like this are the easiest code in the repo
 * to test, which is why the test suite leans on them (see projection.spec).
 *
 * THE MODEL (state every assumption out loud — interviewers probe this):
 * - Each year: employee contributes salary * contributionRate.
 * - Employer match = min(contribution * matchRate, salary * matchCap).
 *   The cap is what makes "50% match up to 3% of salary" behave correctly.
 * - Order within a year: contributions + match are added FIRST, then the
 *   whole balance grows by annualReturnRate. (Contributions at the START of
 *   the year is a modeling choice; end-of-year would give a smaller total.
 *   Naming the choice is the senior move.)
 * - Every yearly figure is rounded to cents so displayed rows sum cleanly.
 */
import {
  ProjectionInput,
  ProjectionResult,
  ProjectionYear,
} from '@fidelity-portfolio-dashboard/domain';
import { roundToCents } from './money';

export function computeProjection(input: ProjectionInput): ProjectionResult {
  const yearly: ProjectionYear[] = [];
  let balance = input.currentBalance;
  let totalContributions = 0;
  let totalEmployerMatch = 0;
  let totalGrowth = 0;

  for (let year = 1; year <= input.years; year++) {
    const startBalance = roundToCents(balance);
    const contributions = roundToCents(
      input.annualSalary * input.contributionRate,
    );
    const employerMatch = roundToCents(
      Math.min(
        contributions * input.employerMatchRate,
        input.annualSalary * input.employerMatchCap,
      ),
    );
    const growth = roundToCents(
      (startBalance + contributions + employerMatch) *
        input.annualReturnRate,
    );
    const endBalance = roundToCents(
      startBalance + contributions + employerMatch + growth,
    );

    yearly.push({
      year,
      startBalance,
      contributions,
      employerMatch,
      growth,
      endBalance,
    });

    totalContributions += contributions;
    totalEmployerMatch += employerMatch;
    totalGrowth += growth;
    balance = endBalance;
  }

  return {
    yearly,
    finalBalance: roundToCents(balance),
    totalContributions: roundToCents(totalContributions),
    totalEmployerMatch: roundToCents(totalEmployerMatch),
    totalGrowth: roundToCents(totalGrowth),
  };
}
