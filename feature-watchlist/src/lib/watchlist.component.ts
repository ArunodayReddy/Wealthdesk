/**
 * watchlist.component.ts — the watchlist page (smart container).
 *
 * WHERE IT IS USED: the /watchlist route.
 *
 * TEACHING NOTE — who owns what: the search box feeds WatchlistService
 * (debounce + switchMap live there); the quote ticker reads
 * AccountsStore.quotes(); an effect keeps the store's poller tracking
 * exactly the current watchlist symbols. The component itself is thin:
 * it wires inputs to services and renders signals. When a component starts
 * accumulating logic, that logic belongs in a service — this file is the
 * example of what "thin" looks like.
 */
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import {
  AccountsStore,
  WatchlistService,
} from '@fidelity-portfolio-dashboard/data-access';
import { QuoteTickerComponent } from '@fidelity-portfolio-dashboard/ui';

@Component({
  selector: 'wd-watchlist',
  standalone: true,
  imports: [QuoteTickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>Watchlist</h2>
      <wd-quote-ticker [quotes]="store.quotes()" />
      <label class="search">
        Search symbols
        <input
          type="text"
          placeholder="e.g. AAPL"
          (input)="onSearch($event)"
        />
      </label>
      @if (watchlist.searching()) {
        <p>Searching…</p>
      }
      @if (watchlist.searchResults().length > 0) {
        <ul class="results">
          @for (q of watchlist.searchResults(); track q.symbol) {
            <li>
              <strong>{{ q.symbol }}</strong> — {{ q.price }}
              <button (click)="watchlist.queueAdd(q.symbol)">Add</button>
            </li>
          }
        </ul>
      }
      <h3>Your watchlist</h3>
      <ul class="items">
        @for (item of watchlist.items(); track item.symbol) {
          <li>
            <strong>{{ item.symbol }}</strong>
            <button (click)="watchlist.remove(item.symbol)">Remove</button>
          </li>
        } @empty {
          <li>Nothing watched yet — search above to add symbols.</li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .search {
        display: block;
        margin: 16px 0;
        font-weight: 600;
      }
      .search input {
        display: block;
        width: 100%;
        max-width: 420px;
        margin-top: 6px;
        padding: 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
      }
      ul {
        list-style: none;
        padding: 0;
      }
      li {
        padding: 8px 0;
        border-bottom: 1px solid #eef1f5;
      }
      button {
        margin-left: 12px;
        padding: 6px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
      }
    `,
  ],
})
export class WatchlistComponent implements OnInit {
  protected readonly watchlist = inject(WatchlistService);
  protected readonly store = inject(AccountsStore);

  constructor() {
    // Keep the quote poller tracking exactly the watchlist symbols.
    effect(() => {
      const symbols = this.watchlist.items().map((i) => i.symbol);
      this.store.setQuoteSymbols(symbols);
    });
  }

  ngOnInit(): void {
    this.watchlist.refresh();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.watchlist.search(value);
  }
}
