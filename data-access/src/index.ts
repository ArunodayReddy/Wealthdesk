/**
 * data-access — public API of the data layer.
 *
 * WHERE IT IS USED: feature libs import services, stores, and interceptors
 * from '@fidelity-portfolio-dashboard/data-access'. Components never import
 * HttpClient or touch fetch() — the barrel is the enforcement point for
 * that rule, and the module-boundary rule backs it up (feature libs may
 * depend on data-access, but data-access may NOT depend on feature libs).
 */
export * from './lib/api-client';
export * from './lib/auth.service';
export * from './lib/interceptors';
export * from './lib/accounts.store';
export * from './lib/planning.service';
export * from './lib/watchlist.service';
