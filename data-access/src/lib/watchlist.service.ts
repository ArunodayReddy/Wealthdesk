/**
 * watchlist.service.ts — search + watchlist state.
 *
 * WHERE IT IS USED: the watchlist page. The component binds an input to
 * search() and renders searchResults/items signals; it never calls the API.
 *
 * TEACHING NOTE — switchMap for search: every keystroke pushes into the
 * search Subject; debounceTime(300) waits for a typing pause;
 * distinctUntilChanged drops repeats; switchMap starts a request and
 * CANCELS the previous one if it hasn't returned. Without switchMap, a
 * slow earlier keystroke ("AA") could land AFTER a later one ("AAPL") and
 * overwrite correct results with stale ones — the classic search race.
 * switchMap is the "latest wins" operator.
 *
 * TEACHING NOTE — concatMap for ordered writes: queueAdd() pushes symbols
 * into a queue; concatMap processes them ONE AT A TIME, IN ORDER, waiting
 * for each POST to finish before starting the next. If the user pastes
 * "MSFT, GOOGL, AMZN" quickly, the server sees them in exactly that order.
 * (mergeMap would fire all three at once — faster, but unordered; for a
 * user-visible list where order is the feature, concatMap is correct.)
 */
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  concatMap,
  EMPTY,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  Quote,
  WatchlistItem,
} from '@fidelity-portfolio-dashboard/domain';
import { ApiClient } from './api-client';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly api = inject(ApiClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();
  private readonly addQueue = new Subject<string>();

  readonly items = signal<WatchlistItem[]>([]);
  readonly searchResults = signal<Quote[]>([]);
  readonly searching = signal(false);

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.searching.set(true)),
        switchMap((q) =>
          q.trim() ? this.api.searchQuotes(q.trim()) : of([]),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });

    this.addQueue
      .pipe(
        concatMap((symbol) =>
          this.api.addToWatchlist(symbol).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.refresh());
  }

  /** Feed keystrokes here; the pipeline debounces + cancels stale searches. */
  search(query: string): void {
    this.searchSubject.next(query);
  }

  /** Queue a symbol to be added, in order, one at a time. */
  queueAdd(symbol: string): void {
    this.addQueue.next(symbol);
  }

  refresh(): void {
    this.api.getWatchlist().subscribe({
      next: (items) => this.items.set(items),
    });
  }

  remove(symbol: string): void {
    this.api.removeFromWatchlist(symbol).subscribe({
      next: () => this.refresh(),
    });
  }
}
