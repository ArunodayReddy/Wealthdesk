/**
 * models.ts — the shared vocabulary of WealthDesk.
 *
 * WHERE IT IS USED: imported by the API (api/src), the Angular data-access
 * services, and every feature component. Both ends of the wire speak these
 * exact shapes, so a field renamed here breaks the build on both sides —
 * that compile-time coupling is the point.
 *
 * WHY IT EXISTS: in a monorepo, the domain lib is the ONE place where a
 * concept is defined. Without it, the API and the web app each invent their
 * own `Account` type, they drift apart, and a bug hides in the gap between
 * them. This lib depends on NOTHING (see the module-boundary rule), so it
 * can never drag framework code into the server or vice versa.
 *
 * TEACHING NOTE — money: amounts here are plain dollar numbers, not integer
 * cents. Real financial systems store integer minor units to dodge float
 * error; this demo rounds to cents at every projection step instead (see
 * util projection.ts). The tradeoff is documented in ARCHITECTURE.md ADR-004
 * (mock-data boundary) — know it before you defend it in an interview.
 */

/** A brokerage, retirement, or cash account a user holds. */
export interface Account {
  id: string;
  name: string;
  /** Which bucket this account belongs to. Drives the dashboard allocation. */
  type: 'brokerage' | 'retirement' | 'cash';
  /** Current total value, in dollars. Mock data — see ARCHITECTURE.md ADR-004. */
  balance: number;
}

/** One position inside an account. */
export interface Holding {
  symbol: string;
  name: string;
  /** Sector drives the allocation breakdown on the dashboard. */
  sector: string;
  shares: number;
  /** Average purchase price per share, in dollars. */
  avgCost: number;
  /** Latest simulated price per share, in dollars. */
  currentPrice: number;
  accountId: string;
}

/** A live-ish price snapshot for one symbol. Prices are SIMULATED ticks
 *  produced by the API — there is no real market feed behind this app. */
export interface Quote {
  symbol: string;
  price: number;
  /** Percent change vs the symbol's base price, e.g. 1.42 means +1.42%. */
  changePercent: number;
  /** ISO timestamp of the tick. */
  asOf: string;
}

/** One symbol the user watches. Server-kept (in-memory) for the demo. */
export interface WatchlistItem {
  symbol: string;
  addedAt: string;
}

/**
 * Input to the 401(k)-style contribution projection.
 * All rates are fractions: 0.10 means 10%.
 */
export interface ProjectionInput {
  /** Balance today, in dollars. */
  currentBalance: number;
  /** Gross annual salary, in dollars. Contributions are a slice of this. */
  annualSalary: number;
  /** Fraction of salary the employee contributes, e.g. 0.10. */
  contributionRate: number;
  /** Employer match rate, e.g. 0.5 = employer adds 50c per $1 contributed. */
  employerMatchRate: number;
  /** Max employer match as a fraction of salary, e.g. 0.03 = 3% of salary. */
  employerMatchCap: number;
  /** Assumed annual return, e.g. 0.07 = 7%. */
  annualReturnRate: number;
  /** How many years to project (1–40). */
  years: number;
}

/** One year of the projection, with every moving part broken out. */
export interface ProjectionYear {
  year: number;
  startBalance: number;
  /** Employee contribution that year. */
  contributions: number;
  /** Employer match that year (capped — see projection.ts). */
  employerMatch: number;
  /** Investment growth that year. */
  growth: number;
  endBalance: number;
}

/** Full projection result: the yearly path plus the totals. */
export interface ProjectionResult {
  yearly: ProjectionYear[];
  finalBalance: number;
  totalContributions: number;
  totalEmployerMatch: number;
  totalGrowth: number;
}

/** One slice of an allocation breakdown: a sector's value and share. */
export interface AllocationSlice {
  sector: string;
  value: number;
  /** Fraction of the total, e.g. 0.42 means 42%. */
  percent: number;
}

/** Standard paged envelope for list endpoints. Page numbers are 1-based. */
export interface PagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Standard error envelope. `code` is machine-readable, `message` is human. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}
