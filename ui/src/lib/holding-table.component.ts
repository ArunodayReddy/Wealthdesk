/**
 * holding-table.component.ts — a dumb table of positions.
 *
 * WHERE IT IS USED: the dashboard (top holdings) and the accounts page
 * (holdings of the selected account). Same component, different data —
 * that reuse is the payoff of the dumb/presentational split.
 *
 * TEACHING NOTE — trackBy and @for: Angular's @for loop needs a track
 * expression so it can tell rows apart across re-renders. Tracking by
 * `holding.symbol` (stable identity) means a price tick updates one row's
 * cells instead of destroying and rebuilding every row — the difference
 * between a smooth ticker and a flickering table. Tracking by $index would
 * defeat this: on any reorder, every row looks "new". OnPush + trackBy is
 * the performance story for every list in this app.
 *
 * TEACHING NOTE — output(): rowClicked is a typed event emitter created
 * with the output() function (the modern replacement for @Output() +
 * EventEmitter). The parent binds (rowClicked)="onSelect($event)".
 */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Holding } from '@fidelity-portfolio-dashboard/domain';
import { formatCurrency, formatSignedPercent } from '@fidelity-portfolio-dashboard/util';

@Component({
  selector: 'wd-holding-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="holdings">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Name</th>
          <th>Shares</th>
          <th>Avg cost</th>
          <th>Price</th>
          <th>Market value</th>
          <th>Gain / loss</th>
        </tr>
      </thead>
      <tbody>
        @for (h of holdings(); track h.symbol) {
          <tr (click)="rowClicked.emit(h)" class="row">
            <td><strong>{{ h.symbol }}</strong></td>
            <td>{{ h.name }}</td>
            <td>{{ h.shares }}</td>
            <td>{{ fmt(h.avgCost) }}</td>
            <td>{{ fmt(h.currentPrice) }}</td>
            <td>{{ fmt(h.shares * h.currentPrice) }}</td>
            <td [class.pos]="gain(h) >= 0" [class.neg]="gain(h) < 0">
              {{ signedPct(h) }}
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="7">No holdings to show.</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      .holdings {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
      }
      th,
      td {
        text-align: left;
        padding: 10px 12px;
        border-bottom: 1px solid #eef1f5;
      }
      .row {
        cursor: pointer;
      }
      .row:hover {
        background: #f6f8fb;
      }
      .pos {
        color: #0a7a42;
      }
      .neg {
        color: #b42318;
      }
    `,
  ],
})
export class HoldingTableComponent {
  readonly holdings = input.required<Holding[]>();
  readonly rowClicked = output<Holding>();

  /** Gain/loss vs average cost, as a fraction. */
  gain(h: Holding): number {
    return h.avgCost > 0 ? (h.currentPrice - h.avgCost) / h.avgCost : 0;
  }

  fmt(value: number): string {
    return formatCurrency(value);
  }

  signedPct(h: Holding): string {
    return formatSignedPercent(this.gain(h));
  }
}
