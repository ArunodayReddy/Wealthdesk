/**
 * api-client.ts — the single place the web app talks HTTP.
 *
 * WHERE IT IS USED: injected by every store/service in this lib. Components
 * NEVER import HttpClient directly — they go through stores, and stores go
 * through this client. If the API base path changes, it changes here once.
 *
 * WHY IT EXISTS: HttpClient calls scattered across components are untestable
 * spaghetti. One client means one place to set headers, one place to type
 * responses, and one mock to swap in tests.
 *
 * TEACHING NOTE — cold observables: HttpClient methods return Observables
 * that do NOTHING until subscribed. Calling api.getAccounts() fires no
 * request; the request fires when a store subscribes. That laziness is what
 * makes switchMap/exhaustMap cancellation possible (see the services).
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Account,
  Holding,
  PagedResponse,
  ProjectionInput,
  ProjectionResult,
  Quote,
  WatchlistItem,
} from '@fidelity-portfolio-dashboard/domain';

/** Relative base: the dev proxy and nginx both forward /api to the server. */
const API_BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  getAccounts(page = 1, pageSize = 20): Observable<PagedResponse<Account>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PagedResponse<Account>>(`${API_BASE}/accounts`, {
      params,
    });
  }

  getHoldings(accountId: string): Observable<Holding[]> {
    return this.http.get<Holding[]>(
      `${API_BASE}/accounts/${accountId}/holdings`,
    );
  }

  getQuotes(symbols?: string[]): Observable<Quote[]> {
    const params =
      symbols?.length
        ? new HttpParams().set('symbols', symbols.join(','))
        : undefined;
    return this.http.get<Quote[]>(`${API_BASE}/quotes`, { params });
  }

  searchQuotes(query: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${API_BASE}/quotes/search`, {
      params: new HttpParams().set('q', query),
    });
  }

  getWatchlist(): Observable<WatchlistItem[]> {
    return this.http.get<WatchlistItem[]>(`${API_BASE}/watchlist`);
  }

  addToWatchlist(symbol: string): Observable<WatchlistItem> {
    return this.http.post<WatchlistItem>(`${API_BASE}/watchlist`, { symbol });
  }

  removeFromWatchlist(symbol: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/watchlist/${symbol}`);
  }

  postProjection(input: ProjectionInput): Observable<ProjectionResult> {
    return this.http.post<ProjectionResult>(`${API_BASE}/projection`, input);
  }
}
