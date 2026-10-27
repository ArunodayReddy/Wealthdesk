/**
 * allocation-bar.component.ts — a dumb sector-allocation visualization.
 *
 * WHERE IT IS USED: the dashboard, under the net-worth cards.
 *
 * WHY CSS BARS, NOT A CHART LIBRARY: an allocation bar is stacked divs
 * with percentage widths — importing a charting library for this would add
 * a dependency, bundle weight, and an API to learn for zero benefit. Senior
 * judgment includes knowing when NOT to add a dependency. (If the app ever
 * needs real charting — time series, tooltips, zoom — that is the moment to
 * evaluate a library, and the decision gets an ADR.)
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AllocationSlice } from '@fidelity-portfolio-dashboard/domain';
import { formatCurrency, formatPercent } from '@fidelity-portfolio-dashboard/util';

@Component({
  selector: 'wd-allocation-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="allocation">
      <div class="bar">
        @for (s of slices(); track s.sector) {
          <div
            class="segment"
            [style.width.%]="s.percent * 100"
            [style.background]="colorFor(s.sector)"
            [title]="s.sector + ': ' + fmtPct(s.percent)"
          ></div>
        }
      </div>
      <ul class="legend">
        @for (s of slices(); track s.sector) {
          <li>
            <span
              class="swatch"
              [style.background]="colorFor(s.sector)"
            ></span>
            {{ s.sector }} — {{ fmt(s.value) }} ({{ fmtPct(s.percent) }})
          </li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      .bar {
        display: flex;
        height: 18px;
        border-radius: 9px;
        overflow: hidden;
        background: #eef1f5;
      }
      .segment {
        height: 100%;
      }
      .legend {
        list-style: none;
        padding: 0;
        margin: 12px 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 13px;
      }
      .swatch {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        margin-right: 6px;
      }
    `,
  ],
})
export class AllocationBarComponent {
  readonly slices = input.required<AllocationSlice[]>();

  private static readonly PALETTE = [
    '#0b5fff',
    '#00a47a',
    '#f2a900',
    '#8b5cf6',
    '#e5484d',
    '#0091ae',
  ];

  /** Deterministic color per sector (hash by index, stable across renders). */
  colorFor(sector: string): string {
    let hash = 0;
    for (let i = 0; i < sector.length; i++) {
      hash = (hash * 31 + sector.charCodeAt(i)) % 997;
    }
    return AllocationBarComponent.PALETTE[
      hash % AllocationBarComponent.PALETTE.length
    ];
  }

  fmt(value: number): string {
    return formatCurrency(value);
  }

  fmtPct(fraction: number): string {
    return formatPercent(fraction);
  }
}
