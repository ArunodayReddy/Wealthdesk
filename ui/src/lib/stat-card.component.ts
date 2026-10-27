/**
 * stat-card.component.ts — a dumb metric card (label + big value + subtext).
 *
 * WHERE IT IS USED: the dashboard (net worth, account count, day change)
 * and anywhere a single number deserves a card.
 *
 * WHY "DUMB": this component owns NO state and makes NO HTTP calls. Data
 * flows in through @Input signals (input()), and nothing flows out except
 * through @Output events (this one has none — it is purely presentational).
 * Dumb components are trivially testable and reusable: the same card renders
 * a net worth, a balance, or a projected total with zero changes.
 *
 * TEACHING NOTE — input() signals (Angular 17+): inputs are now signals,
 * read by calling them as functions (label()). OnPush + signal inputs is
 * the modern combo: the component re-renders only when an input signal's
 * VALUE changes, not on every parent change-detection pass.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'wd-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card">
      <div class="stat-label">{{ label() }}</div>
      <div class="stat-value">{{ value() }}</div>
      @if (subtext()) {
        <div class="stat-sub">{{ subtext() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .stat-card {
        background: #fff;
        border: 1px solid #e2e6ec;
        border-radius: 8px;
        padding: 16px;
      }
      .stat-label {
        font-size: 13px;
        color: #5a6b84;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .stat-value {
        font-size: 26px;
        font-weight: 700;
        margin-top: 6px;
      }
      .stat-sub {
        font-size: 13px;
        color: #5a6b84;
        margin-top: 4px;
      }
    `,
  ],
})
export class StatCardComponent {
  /** Uppercase label, e.g. "Net worth". Required input. */
  readonly label = input.required<string>();
  /** Pre-formatted value string, e.g. "$382,361.50". Formatting lives in util. */
  readonly value = input.required<string>();
  /** Optional supporting line, e.g. "Across 5 accounts". */
  readonly subtext = input<string>('');
}
