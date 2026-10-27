/**
 * accounts.store.ts — the portfolio state, held in signals.
 *
 * WHERE IT IS USED: the dashboard (net worth, allocation), the accounts
 * page (list + per-account holdings), and the watchlist (quote polling).
 * Components read signals and computed values; they never call the API.
 *
 * WHY SIGNALS INSTEAD OF NgRx (see ARCHITECTURE.md ADR-002): this state is
 * simple — a few lists, one selection, derived totals. Signals + computed
 * give the same reactivity with a fraction of the boilerplate. NgRx earns
 * its keep when state updates come from many sources with complex rules;
 * that is not this app, and reaching for it anyway would be resume-driven
 * architecture, not engineering.
 *
 * TEACHING NOTE — the three RxJS patterns in this file:
 * 1. POLLING with switchMap: timer(0, 5000) ticks every 5s; switchMap
 *    starts a fresh quotes request per tick and CANCELS the previous one if
 *    it is still in flight. Without switchMap, a slow network would stack
 *    overlapping requests and deliver stale prices out of order.
 * 2. CONCURRENT fan-out with mergeMap: refreshAllHoldings fires one
 *    request per account concurrently, capped at 3 in flight. mergeMap is
 *    the "parallel" operator — results arrive in completion order, not
 *    request order, which is fine here because we merge by account id.
 * 3. takeUntilDestroyed: services outlive components, but this store is
 *    providedIn: 'root' (app lifetime), so the subscription effectively
 *    lives as long as the app. The operator is still correct hygiene: if
 *    the provider scope ever narrows, teardown follows automatically.
 */
import { DestroyRef, inject, Injectable, computed, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { from, mergeMap, of, switchMap, timer, toArray } from 'rxjs';
import {
  Account,
  AllocationSlice,
  Holding,
  Quote,
} from '@fidelity-portfolio-dashboard/domain';
import { groupBy } from '@fidelity-portfolio-dashboard/util';
import { ApiClient } from './api-client';

@Injectable({ providedIn: 'root' })
export class AccountsStore {
  private readonly api = inject(ApiClient);
  private readonly destroyRef = inject(DestroyRef);

  /** Raw state — written only by this store's methods. */
  readonly accounts = signal<Account[]>([]);
  readonly allHoldings = signal<Holding[]>([]);
  readonly selectedAccountId = signal<string | null>(null);
  readonly quotes = signal<Quote[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Pagination state for the accounts list. */
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalPages = signal(1);

  /** Symbols the quote poller tracks. Change this and polling restarts. */
  private readonly quoteSymbols = signal<string[]>([]);

  constructor() {
    // ONE polling pipeline, driven by state: whenever quoteSymbols changes,
    // switchMap tears down the old timer and starts a new 5s poll for the
    // new set. No component ever manages a subscription directly, so
    // polling can never be started twice or left running for stale symbols.
    toObservable(this.quoteSymbols)
      .pipe(
        switchMap((symbols) =>
          symbols.length > 0
            ? timer(0, 5000).pipe(switchMap(() => this.api.getQuotes(symbols)))
            : of([] as Quote[]),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (quotes) => this.quotes.set(quotes),
        error: (err: Error) => this.error.set(err.message),
      });
  }

  /** Derived state — recomputed automatically when inputs change. */
  readonly netWorth = computed(() =>
    this.accounts().reduce((sum, a) => sum + a.balance, 0),
  );

  readonly selectedHoldings = computed(() => {
    const id = this.selectedAccountId();
    const all = this.allHoldings();
    return id ? all.filter((h) => h.accountId === id) : all;
  });

  /** Allocation across ALL holdings, grouped by sector (see util groupBy). */
  readonly allocation = computed<AllocationSlice[]>(() => {
    const grouped = groupBy(this.allHoldings(), (h) => h.sector);
    const slices = Object.entries(grouped).map(([sector, rows]) => ({
      sector,
      value: rows.reduce((sum, h) => sum + h.shares * h.currentPrice, 0),
    }));
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    return slices
      .map((s) => ({
        ...s,
        percent: total > 0 ? s.value / total : 0,
      }))
      .sort((a, b) => b.value - a.value);
  });

  loadAccounts(page = this.page(), pageSize = this.pageSize()): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAccounts(page, pageSize).subscribe({
      next: (result) => {
        this.accounts.set(result.data);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  /** Fetches one account's holdings and merges them into allHoldings. */
  loadHoldings(accountId: string): void {
    this.api.getHoldings(accountId).subscribe({
      next: (rows) => {
        const rest = this.allHoldings().filter(
          (h) => h.accountId !== accountId,
        );
        this.allHoldings.set([...rest, ...rows]);
      },
      error: (err: Error) => this.error.set(err.message),
    });
  }

  /** Fetches every account's holdings concurrently (max 3 in flight). */
  refreshAllHoldings(): void {
    const ids = this.accounts().map((a) => a.id);
    if (ids.length === 0) {
      return;
    }
    from(ids)
      .pipe(
        // mergeMap = parallel with a concurrency cap. Order of arrival
        // doesn't matter: we merge by accountId, not by position.
        mergeMap((id) => this.api.getHoldings(id), 3),
        toArray(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => this.allHoldings.set(groups.flat()),
        error: (err: Error) => this.error.set(err.message),
      });
  }

  selectAccount(accountId: string | null): void {
    this.selectedAccountId.set(accountId);
    if (accountId) {
      this.loadHoldings(accountId);
    }
  }

  /**
   * Set the symbols the poller tracks. The constructor's pipeline restarts
   * polling for the new set automatically — components never subscribe to
   * timers themselves.
   */
  setQuoteSymbols(symbols: string[]): void {
    this.quoteSymbols.set(symbols);
  }
}
