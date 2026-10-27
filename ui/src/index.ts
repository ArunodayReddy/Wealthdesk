/**
 * ui — public API of the presentational component lib.
 *
 * WHERE IT IS USED: feature libs import these dumb components. The boundary
 * rule guarantees this lib never imports data-access or feature libs — if a
 * presentational component ever "needs" a service, that is a design smell:
 * lift the data need up to the feature container and pass it down as an
 * input instead.
 */
export * from './lib/stat-card.component';
export * from './lib/holding-table.component';
export * from './lib/allocation-bar.component';
export * from './lib/quote-ticker.component';
