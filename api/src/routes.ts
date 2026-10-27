/**
 * routes.ts — the REST API, versioned under /api/v1.
 *
 * WHERE IT IS USED: mounted by main.ts at /api/v1. The Angular app calls
 * these endpoints through relative URLs (/api/v1/...) so the dev proxy and
 * the nginx proxy in Docker both work without code changes.
 *
 * WHY VERSIONED: /v1 in the path is the cheapest API evolution strategy.
 * When a breaking change is needed, ship /v2 alongside /v1 instead of
 * breaking every client at once. Microservice thinking starts here: this
 * router owns the portfolio domain and nothing else; a second domain
 * (say, orders) would be a second router, possibly a second service.
 *
 * REST DESIGN CHOICES (defend these in an interview):
 * - Nouns, not verbs: /accounts, /holdings, /quotes — the HTTP method is
 *   the verb (GET reads, POST creates/computes, DELETE removes).
 * - Pagination on every list: ?page=&pageSize= with a paged envelope, so
 *   no endpoint can ever dump an unbounded list.
 * - Errors use the standard envelope (see errors.ts) with correct codes:
 *   400 bad input, 404 unknown id/symbol, 409 duplicate watchlist entry.
 * - POST /projection is a computation, not a creation: it creates no
 *   resource, so it returns 200 (not 201) with the result body.
 * - All handlers here are synchronous on purpose: Express 4 does NOT catch
 *   rejected promises from async handlers, so an async handler needs an
 *   explicit wrapper. Keeping handlers sync removes that whole bug class
 *   for a demo of this size.
 */
import { Router } from 'express';
import {
  PagedResponse,
  ProjectionInput,
  Quote,
  WatchlistItem,
} from '@fidelity-portfolio-dashboard/domain';
import {
  computeProjection,
  validateProjectionInput,
} from '@fidelity-portfolio-dashboard/util';
import {
  ACCOUNTS,
  HOLDINGS,
  SYMBOL_UNIVERSE,
  currentPriceOf,
  tickQuotes,
} from './data';
import { ApiError, badRequest, notFound } from './errors';

export const apiRouter = Router();

/** In-memory watchlist. Seeded; a real service would persist per user. */
const watchlist: WatchlistItem[] = [
  { symbol: 'AAPL', addedAt: new Date().toISOString() },
  { symbol: 'NVDA', addedAt: new Date().toISOString() },
];

/** Clamp + slice a list into a paged envelope. Page numbers are 1-based. */
function paginate<T>(items: T[], page: number, pageSize: number): PagedResponse<T> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.min(100, Math.max(1, Math.floor(pageSize) || 20));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const start = (safePage - 1) * safeSize;
  return {
    data: items.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages,
  };
}

function parsePageParam(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------- accounts
apiRouter.get('/accounts', (req, res) => {
  const page = parsePageParam(req.query['page'], 1);
  const pageSize = parsePageParam(req.query['pageSize'], 20);
  res.json(paginate(ACCOUNTS, page, pageSize));
});

apiRouter.get('/accounts/:id', (req, res) => {
  const account = ACCOUNTS.find((a) => a.id === req.params['id']);
  if (!account) {
    throw notFound(`Account ${req.params['id']}`);
  }
  res.json(account);
});

apiRouter.get('/accounts/:id/holdings', (req, res) => {
  const account = ACCOUNTS.find((a) => a.id === req.params['id']);
  if (!account) {
    throw notFound(`Account ${req.params['id']}`);
  }
  // Refresh currentPrice from the live tick state so holdings track the
  // same simulated market as the quotes endpoint.
  const holdings = HOLDINGS.filter((h) => h.accountId === account.id).map(
    (h) => ({ ...h, currentPrice: currentPriceOf(h.symbol) || h.currentPrice }),
  );
  res.json(holdings);
});

// ------------------------------------------------------------------ quotes
apiRouter.get('/quotes', (req, res) => {
  const raw = req.query['symbols'];
  const symbols =
    typeof raw === 'string' && raw.length > 0
      ? raw.split(',').map((s) => s.trim().toUpperCase())
      : undefined;
  res.json(tickQuotes(symbols));
});

apiRouter.get('/quotes/search', (req, res) => {
  const q = typeof req.query['q'] === 'string' ? req.query['q'].trim().toUpperCase() : '';
  if (!q) {
    res.json([]);
    return;
  }
  const matches: Quote[] = SYMBOL_UNIVERSE.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q),
  ).map((s) => ({
    symbol: s.symbol,
    price: Math.round(currentPriceOf(s.symbol) * 100) / 100,
    changePercent:
      Math.round(((currentPriceOf(s.symbol) - s.basePrice) / s.basePrice) * 10000) / 100,
    asOf: new Date().toISOString(),
  }));
  res.json(matches);
});

// --------------------------------------------------------------- watchlist
apiRouter.get('/watchlist', (_req, res) => {
  res.json(watchlist);
});

apiRouter.post('/watchlist', (req, res) => {
  const symbol =
    typeof req.body?.['symbol'] === 'string'
      ? req.body['symbol'].trim().toUpperCase()
      : '';
  const known = SYMBOL_UNIVERSE.some((s) => s.symbol === symbol);
  if (!known) {
    throw notFound(`Symbol ${symbol}`);
  }
  if (watchlist.some((w) => w.symbol === symbol)) {
    throw new ApiError(409, 'DUPLICATE', `Symbol ${symbol} is already on the watchlist`);
  }
  const item: WatchlistItem = { symbol, addedAt: new Date().toISOString() };
  watchlist.push(item);
  res.status(201).json(item);
});

apiRouter.delete('/watchlist/:symbol', (req, res) => {
  const symbol = (req.params['symbol'] ?? '').toUpperCase();
  const index = watchlist.findIndex((w) => w.symbol === symbol);
  if (index === -1) {
    throw notFound(`Watchlist entry ${symbol}`);
  }
  watchlist.splice(index, 1);
  res.status(204).send();
});

// -------------------------------------------------------------- projection
apiRouter.post('/projection', (req, res) => {
  // The server is the authority on validation: client-side checks are a
  // courtesy, but anyone can POST directly, so the rules run here too.
  const input = req.body as ProjectionInput;
  const errors = validateProjectionInput(input);
  if (errors.length > 0) {
    throw badRequest('Invalid projection input', errors);
  }
  res.json(computeProjection(input));
});
