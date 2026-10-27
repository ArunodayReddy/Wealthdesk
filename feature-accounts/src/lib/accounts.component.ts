/**
 * accounts.component.ts — the accounts page (smart container).
 *
 * WHERE IT IS USED: the /accounts route.
 *
 * TEACHING NOTE — pagination as state: the page lives in the STORE
 * (store.page), not in the component, because the URL-less page is shared
 * state — the dashboard and this page both read the same accounts signal.
 * nextPage/prevPage clamp at the bounds (1..totalPages) instead of letting
 * the API return an empty page for page 99: the UI owns its invariants,
 * it doesn't outsource them to the server's forgiveness.
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { AccountsStore } from '@fidelity-portfolio-dashboard/data-access';
import { HoldingTableComponent } from '@fidelity-portfolio-dashboard/ui';
import { formatCurrency } from '@fidelity-portfolio-dashboard/util';

@Component({
  selector: 'wd-accounts',
  standalone: true,
  imports: [HoldingTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>Accounts</h2>
      @if (store.error()) {
        <p class="error">{{ store.error() }}</p>
      }
      <div class="list">
        @for (a of store.accounts(); track a.id) {
          <button
            class="account"
            [class.selected]="store.selectedAccountId() === a.id"
            (click)="select(a.id)"
          >
            <strong>{{ a.name }}</strong>
            <span>{{ a.type }} — {{ fmt(a.balance) }}</span>
          </button>
        }
      </div>
      <div class="pager">
        <button (click)="prevPage()" [disabled]="store.page() <= 1">
          Previous
        </button>
        <span>Page {{ store.page() }} of {{ store.totalPages() }}</span>
        <button
          (click)="nextPage()"
          [disabled]="store.page() >= store.totalPages()"
        >
          Next
        </button>
      </div>
      @if (store.selectedAccountId()) {
        <h3>Holdings</h3>
        <wd-holding-table [holdings]="store.selectedHoldings()" />
      }
      @if (store.loading()) {
        <p>Loading…</p>
      }
    </section>
  `,
  styles: [
    `
      .list {
        display: grid;
        gap: 10px;
        margin: 16px 0;
      }
      .account {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        border: 1px solid #e2e6ec;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
        text-align: left;
      }
      .account.selected {
        border-color: #0b5fff;
        background: #eef4ff;
      }
      .pager {
        display: flex;
        gap: 12px;
        align-items: center;
        margin: 12px 0;
      }
      .error {
        color: #b42318;
      }
    `,
  ],
})
export class AccountsComponent implements OnInit {
  protected readonly store = inject(AccountsStore);

  ngOnInit(): void {
    this.store.loadAccounts();
  }

  select(accountId: string): void {
    this.store.selectAccount(accountId);
  }

  prevPage(): void {
    if (this.store.page() > 1) {
      this.store.page.set(this.store.page() - 1);
      this.store.loadAccounts();
    }
  }

  nextPage(): void {
    if (this.store.page() < this.store.totalPages()) {
      this.store.page.set(this.store.page() + 1);
      this.store.loadAccounts();
    }
  }

  fmt(value: number): string {
    return formatCurrency(value);
  }
}
