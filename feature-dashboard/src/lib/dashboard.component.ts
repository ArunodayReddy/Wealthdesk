/**
 * dashboard.component.ts — the WealthDesk home page (smart container).
 *
 * WHERE IT IS USED: the /dashboard route.
 *
 * WHY "SMART": this component OWNS data flow — it triggers loads, reads
 * store signals, and passes plain values down to dumb ui components. The
 * ui components never know where data came from. That split is the
 * container/presentational pattern, and it is what makes both halves
 * independently testable.
 *
 * TEACHING NOTE — effect(): the constructor effect watches accounts(); the
 * moment accounts arrive and holdings are still empty, it triggers
 * refreshAllHoldings(). Effects are for SIDE EFFECTS derived from signal
 * changes — never for computing values (that is computed's job). The
 * length guard prevents a loop: after refresh, allHoldings is non-empty,
 * so the effect's condition goes false on its next run.
 */
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { AccountsStore } from '@fidelity-portfolio-dashboard/data-access';
import {
  AllocationBarComponent,
  HoldingTableComponent,
  QuoteTickerComponent,
  StatCardComponent,
} from '@fidelity-portfolio-dashboard/ui';
import { formatCurrency } from '@fidelity-portfolio-dashboard/util';

@Component({
  selector: 'wd-dashboard',
  standalone: true,
  imports: [
    StatCardComponent,
    HoldingTableComponent,
    AllocationBarComponent,
    QuoteTickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>Portfolio dashboard</h2>
      @if (store.error()) {
        <p class="error">{{ store.error() }}</p>
      }
      <div class="cards">
        <wd-stat-card
          label="Net worth"
          [value]="fmt(store.netWorth())"
          subtext="Across all accounts"
        />
        <wd-stat-card
          label="Accounts"
          [value]="str(store.accounts().length)"
          subtext="Brokerage, retirement, cash"
        />
        <wd-stat-card
          label="Positions"
          [value]="str(store.allHoldings().length)"
          subtext="Across all accounts"
        />
      </div>
      <wd-quote-ticker [quotes]="store.quotes()" />
      <h3>Allocation by sector</h3>
      <wd-allocation-bar [slices]="store.allocation()" />
      <h3>Holdings</h3>
      <p class="hint">Click a row to filter to that holding's account.</p>
      <wd-holding-table
        [holdings]="store.selectedHoldings()"
        (rowClicked)="store.selectAccount($event.accountId)"
      />
      @if (store.loading()) {
        <p>Loading…</p>
      }
    </section>
  `,
  styles: [
    `
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }
      .error {
        color: #b42318;
      }
      .hint {
        color: #5a6b84;
        font-size: 13px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(AccountsStore);

  constructor() {
    // Load holdings once accounts arrive (see teaching note above).
    effect(() => {
      const accounts = this.store.accounts();
      if (accounts.length > 0 && this.store.allHoldings().length === 0) {
        this.store.refreshAllHoldings();
      }
    });
  }

  ngOnInit(): void {
    this.store.loadAccounts();
    this.store.setQuoteSymbols(['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN']);
  }

  fmt(value: number): string {
    return formatCurrency(value);
  }

  /** Templates can only see component members, not globals like String —
   *  so counts go through this helper. (A template expression is type-
   *  checked against the component class, not the global scope.) */
  str(value: number): string {
    return String(value);
  }
}
