/**
 * planner.component.ts — the 401(k) contribution planner (smart container).
 *
 * WHERE IT IS USED: the /planning route.
 *
 * TEACHING NOTE — two layers of validation, and why both:
 * 1. Per-control Angular validators (required, min, max) give instant
 *    feedback as the user types.
 * 2. A FORM-LEVEL validator runs the SAME pure rules the server runs
 *    (util validateProjectionInput) over the assembled input. The form
 *    holds PERCENT numbers (10 means 10%) because that is what humans
 *    type; the validator converts to fractions (0.10) before checking.
 *    The server re-validates on POST regardless — client checks are UX,
 *    server checks are the contract. Never trust the client alone.
 *
 * TEACHING NOTE — submit goes through PlanningService, whose exhaustMap
 * pipeline drops double-clicks while a projection is in flight. The
 * component only reads result/loading/error signals; it knows nothing
 * about HTTP.
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { PlanningService } from '@fidelity-portfolio-dashboard/data-access';
import { ProjectionInput } from '@fidelity-portfolio-dashboard/domain';
import {
  formatCurrency,
  validateProjectionInput,
} from '@fidelity-portfolio-dashboard/util';

/** Form-level validator: converts percent fields to fractions, then runs
 *  the shared pure rules. Returns { projection: string[] } on failure. */
export function plannerFormValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const v = group.value as {
    currentBalance: number;
    annualSalary: number;
    contributionPct: number;
    employerMatchPct: number;
    employerMatchCapPct: number;
    annualReturnPct: number;
    years: number;
  };
  const input: ProjectionInput = {
    currentBalance: v.currentBalance,
    annualSalary: v.annualSalary,
    contributionRate: (v.contributionPct ?? 0) / 100,
    employerMatchRate: (v.employerMatchPct ?? 0) / 100,
    employerMatchCap: (v.employerMatchCapPct ?? 0) / 100,
    annualReturnRate: (v.annualReturnPct ?? 0) / 100,
    years: v.years ?? 0,
  };
  const errors = validateProjectionInput(input);
  return errors.length > 0 ? { projection: errors } : null;
}

@Component({
  selector: 'wd-planner',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>Retirement planner</h2>
      <p class="hint">
        Project a 401(k)-style balance over time. Contributions are a
        percent of salary; the employer match is capped (see the match-cap
        field). The math runs server-side — this form only collects input.
      </p>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <label>
          Current balance ($)
          <input type="number" formControlName="currentBalance" min="0" />
        </label>
        <label>
          Annual salary ($)
          <input type="number" formControlName="annualSalary" min="1" />
        </label>
        <label>
          Your contribution (% of salary)
          <input
            type="number"
            formControlName="contributionPct"
            min="0"
            max="100"
            step="0.5"
          />
        </label>
        <label>
          Employer match rate (% of your contribution)
          <input
            type="number"
            formControlName="employerMatchPct"
            min="0"
            step="10"
          />
        </label>
        <label>
          Employer match cap (% of salary)
          <input
            type="number"
            formControlName="employerMatchCapPct"
            min="0"
            max="100"
            step="0.5"
          />
        </label>
        <label>
          Assumed annual return (%)
          <input
            type="number"
            formControlName="annualReturnPct"
            step="0.5"
          />
        </label>
        <label>
          Years to project
          <input type="number" formControlName="years" min="1" max="40" />
        </label>
        @if (form.errors?.['projection'] && form.touched) {
          <ul class="error">
            @for (e of form.errors['projection']; track e) {
              <li>{{ e }}</li>
            }
          </ul>
        }
        <button type="submit" [disabled]="planning.loading()">
          {{ planning.loading() ? 'Projecting…' : 'Project' }}
        </button>
      </form>

      @if (planning.error()) {
        <p class="error">{{ planning.error() }}</p>
      }
      @if (planning.result(); as result) {
        <h3>Projected balance: {{ fmt(result.finalBalance) }}</h3>
        <p>
          Contributions {{ fmt(result.totalContributions) }} · Employer
          match {{ fmt(result.totalEmployerMatch) }} · Growth
          {{ fmt(result.totalGrowth) }}
        </p>
        <table class="years">
          <thead>
            <tr>
              <th>Year</th>
              <th>Start</th>
              <th>Contributions</th>
              <th>Match</th>
              <th>Growth</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            @for (y of result.yearly; track y.year) {
              <tr>
                <td>{{ y.year }}</td>
                <td>{{ fmt(y.startBalance) }}</td>
                <td>{{ fmt(y.contributions) }}</td>
                <td>{{ fmt(y.employerMatch) }}</td>
                <td>{{ fmt(y.growth) }}</td>
                <td>{{ fmt(y.endBalance) }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [
    `
      .form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        max-width: 800px;
      }
      label {
        display: block;
        font-weight: 600;
      }
      input {
        display: block;
        width: 100%;
        margin-top: 6px;
        padding: 9px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
      }
      button {
        margin-top: 12px;
        padding: 10px 18px;
        border: 0;
        border-radius: 6px;
        background: #0b5fff;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
      }
      .years {
        border-collapse: collapse;
        background: #fff;
      }
      .years th,
      .years td {
        text-align: left;
        padding: 8px 12px;
        border-bottom: 1px solid #eef1f5;
      }
      .error {
        color: #b42318;
      }
      .hint {
        color: #5a6b84;
      }
    `,
  ],
})
export class PlannerComponent {
  protected readonly planning = inject(PlanningService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      currentBalance: [10000, [Validators.required, Validators.min(0)]],
      annualSalary: [100000, [Validators.required, Validators.min(1)]],
      contributionPct: [
        10,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      employerMatchPct: [50, [Validators.required, Validators.min(0)]],
      employerMatchCapPct: [
        3,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      annualReturnPct: [7, [Validators.required]],
      years: [
        20,
        [Validators.required, Validators.min(1), Validators.max(40)],
      ],
    },
    { validators: plannerFormValidator },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input: ProjectionInput = {
      currentBalance: v.currentBalance,
      annualSalary: v.annualSalary,
      contributionRate: v.contributionPct / 100,
      employerMatchRate: v.employerMatchPct / 100,
      employerMatchCap: v.employerMatchCapPct / 100,
      annualReturnRate: v.annualReturnPct / 100,
      years: v.years,
    };
    this.planning.submit(input);
  }

  fmt(value: number): string {
    return formatCurrency(value);
  }
}
