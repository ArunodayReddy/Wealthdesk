/**
 * util — public API of the pure-helpers lib.
 *
 * WHERE IT IS USED: imported by the API (projection math, validation,
 * money formatting) and by Angular libs (formatting, grouping). It depends
 * on NOTHING except the domain types, so it runs identically on server and
 * browser — that portability is why pure logic lives here and not in a
 * component.
 */
export * from './lib/money';
export * from './lib/projection';
export * from './lib/event-loop';
export * from './lib/async-demo';
export * from './lib/generics';
export * from './lib/validators';
