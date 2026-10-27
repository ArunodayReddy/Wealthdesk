/**
 * data.ts — the mock dataset and the simulated price engine.
 *
 * WHERE IT IS USED: imported by routes.ts only. Nothing else in the server
 * touches this data directly, so swapping mock data for a real store later
 * means changing one file, not every route.
 *
 * WHY IT IS MOCK DATA, STATED PLAINLY: WealthDesk has no brokerage
 * integration, no market-data license, and no real money. Every account,
 * holding, and price here is invented for learning and demo purposes.
 * The API is honest about that: prices are a random walk around fixed base
 * prices, and the README + UI carry a MOCK DATA label. Never present this
 * as real market data in an interview — say "simulated feed" and explain
 * the walk.
 *
 * TEACHING NOTE — the tick walk: each GET /quotes nudges every tracked
 * price by up to ±0.5% and clamps it within ±5% of its base price, so the
 * UI's polling visibly moves without drifting into absurdity. State lives
 * in module scope (a Map) because this is a single-process demo server;
 * a real service would keep this in Redis or a database, not memory.
 */
import {
  Account,
  Holding,
  Quote,
} from '@fidelity-portfolio-dashboard/domain';

/** The tradeable universe. Search and quotes only know these symbols. */
export const SYMBOL_UNIVERSE: ReadonlyArray<{
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
}> = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 232.5 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', basePrice: 428.1 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', basePrice: 131.2 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', basePrice: 178.25 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', basePrice: 201.3 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', basePrice: 152.4 },
  { symbol: 'VTI', name: 'Vanguard Total Stock ETF', sector: 'Funds', basePrice: 285.6 },
  { symbol: 'BND', name: 'Vanguard Total Bond ETF', sector: 'Funds', basePrice: 72.15 },
];

/** Accounts. Balances are the sum of their holdings plus a cash sleeve. */
export const ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Everyday Brokerage', type: 'brokerage', balance: 84320.5 },
  { id: 'acc-2', name: 'Rollover IRA', type: 'retirement', balance: 142870.25 },
  { id: 'acc-3', name: '401(k) Plan', type: 'retirement', balance: 96540.0 },
  { id: 'acc-4', name: 'Joint Brokerage', type: 'brokerage', balance: 51230.75 },
  { id: 'acc-5', name: 'High-Yield Cash', type: 'cash', balance: 12400.0 },
];

/** Positions. currentPrice starts at the base price; ticks move it. */
export const HOLDINGS: Holding[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', shares: 120, avgCost: 178.4, currentPrice: 232.5, accountId: 'acc-1' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', shares: 60, avgCost: 310.2, currentPrice: 428.1, accountId: 'acc-1' },
  { symbol: 'VTI', name: 'Vanguard Total Stock ETF', sector: 'Funds', shares: 90, avgCost: 240.0, currentPrice: 285.6, accountId: 'acc-1' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', shares: 150, avgCost: 88.6, currentPrice: 131.2, accountId: 'acc-2' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', shares: 80, avgCost: 140.1, currentPrice: 152.4, accountId: 'acc-2' },
  { symbol: 'BND', name: 'Vanguard Total Bond ETF', sector: 'Funds', shares: 200, avgCost: 70.5, currentPrice: 72.15, accountId: 'acc-2' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', shares: 45, avgCost: 142.8, currentPrice: 178.25, accountId: 'acc-3' },
  { symbol: 'VTI', name: 'Vanguard Total Stock ETF', sector: 'Funds', shares: 150, avgCost: 252.3, currentPrice: 285.6, accountId: 'acc-3' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', shares: 40, avgCost: 175.9, currentPrice: 201.3, accountId: 'acc-4' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', shares: 50, avgCost: 195.0, currentPrice: 232.5, accountId: 'acc-4' },
];

/** In-memory current prices, seeded from base prices. */
const livePrices = new Map<string, number>(
  SYMBOL_UNIVERSE.map((s) => [s.symbol, s.basePrice]),
);

/**
 * Advance every tracked price by a small random walk and return fresh
 * quotes. Change percent is measured against the BASE price, not the last
 * tick, so it reads like a day-change figure.
 */
export function tickQuotes(symbols?: string[]): Quote[] {
  const asOf = new Date().toISOString();
  const wanted = symbols?.length
    ? SYMBOL_UNIVERSE.filter((s) => symbols.includes(s.symbol))
    : SYMBOL_UNIVERSE;
  return wanted.map((s) => {
    const previous = livePrices.get(s.symbol) ?? s.basePrice;
    // ±0.5% step, clamped to ±5% of base so the demo never runs away.
    const step = previous * (Math.random() * 0.01 - 0.005);
    const next = Math.min(
      Math.max(previous + step, s.basePrice * 0.95),
      s.basePrice * 1.05,
    );
    livePrices.set(s.symbol, next);
    return {
      symbol: s.symbol,
      price: Math.round(next * 100) / 100,
      changePercent: Math.round(((next - s.basePrice) / s.basePrice) * 10000) / 100,
      asOf,
    };
  });
}

/** Current price snapshot WITHOUT advancing the walk (for holdings). */
export function currentPriceOf(symbol: string): number {
  return livePrices.get(symbol) ?? 0;
}
