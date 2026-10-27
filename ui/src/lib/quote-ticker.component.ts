/**
 * quote-ticker.component.ts — a dumb strip of live-ish quotes.
 *
 * WHERE IT IS USED: the dashboard header area and the watchlist page.
 * The parent owns the polling (AccountsStore.startQuotePolling); this
 * component only renders whatever quotes it is handed. That split is why
 * the ticker never fetches: two parents polling independently would double
 * the request rate for the same data.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Quote } from '@fidelity-portfolio-dashboard/domain';
import { formatCurrency, formatSignedPercent } from '@fidelity-portfolio-dashboard/util';

@Component({
  selector: 'wd-quote-ticker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ticker">
      @for (q of quotes(); track q.symbol) {
        <span class="quote">
          <strong>{{ q.symbol }}</strong>
          {{ fmt(q.price) }}
          <span [class.pos]="q.changePercent >= 0" [class.neg]="q.changePercent < 0">
            {{ signedPct(q.changePercent) }}
          </span>
        </span>
      } @empty {
        <span class="quote">No quotes yet — polling starts on load.</span>
      }
    </div>
  `,
  styles: [
    `
      .ticker {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        background: #0f2040;
        color: #fff;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
      }
      .pos {
        color: #4ade80;
      }
      .neg {
        color: #f87171;
      }
    `,
  ],
})
export class QuoteTickerComponent {
  readonly quotes = input.required<Quote[]>();

  fmt(value: number): string {
    return formatCurrency(value);
  }

  signedPct(changePercent: number): string {
    // changePercent here is already a PERCENT number (e.g. 1.42), not a
    // fraction — so format it directly instead of via formatSignedPercent.
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }
}
