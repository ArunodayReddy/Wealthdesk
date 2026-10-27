/**
 * planner.component.spec.ts — tests for the form-level validator.
 *
 * WHAT THIS PROVES: the validator that runs in the browser is the SAME
 * rule set the server runs (util validateProjectionInput), just wrapped
 * for Angular forms. No TestBed needed: FormBuilder is instantiable
 * directly, so this test runs as a plain unit test.
 */
import { FormBuilder } from '@angular/forms';
import { plannerFormValidator } from './planner.component';

const fb = new FormBuilder();

function makeGroup(overrides: Record<string, unknown> = {}) {
  return fb.nonNullable.group(
    {
      currentBalance: [10000],
      annualSalary: [100000],
      contributionPct: [10],
      employerMatchPct: [50],
      employerMatchCapPct: [3],
      annualReturnPct: [7],
      years: [20],
      ...overrides,
    },
    { validators: plannerFormValidator },
  );
}

describe('plannerFormValidator', () => {
  it('passes a valid form', () => {
    expect(makeGroup().valid).toBe(true);
    expect(makeGroup().errors).toBeNull();
  });

  it('flags a contribution over 100%', () => {
    const group = makeGroup({ contributionPct: [150] });
    expect(group.errors?.['projection']).toContain(
      'contributionRate must be between 0 and 1',
    );
  });

  it('flags years outside 1–40', () => {
    const group = makeGroup({ years: [50] });
    expect(group.errors?.['projection']).toContain(
      'years must be a whole number between 1 and 40',
    );
  });
});
