/**
 * money.ts — formatting helpers for dollar amounts.
 *
 * WHERE IT IS USED: every component that renders money (stat cards, holding
 * tables, planner results) and the API's error-free display paths. Nothing
 * here touches Angular — it is plain TypeScript, so the server can import
 * it too (see the module-boundary rule: util depends on nothing).
 *
 * WHY IT EXISTS: formatting scattered across components drifts ("$1,234.5"
 * in one place, "1234.50" in another). One function, one format, everywhere.
 *
 * TEACHING NOTE — Intl.NumberFormat: never hand-roll currency formatting
 * with string concatenation. Intl handles grouping separators, the currency
 * symbol, and negative values per locale, and it is built into the runtime.
 */
export function roundToCents(value: number): number {
  // Math.round on value*100 then /100 avoids 0.1+0.2-style float dust in
  // displayed totals. (Real ledgers use integer cents; see models.ts.)
  return Math.round(value * 100) / 100;
}

/** "$1,234,567.89" — always two fraction digits, US locale. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** 0.0714 -> "7.14%". Input is a fraction, not a whole-number percent. */
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

/** Like formatPercent, but with an explicit + sign for gains: "+1.42%". */
export function formatSignedPercent(fraction: number): string {
  const sign = fraction >= 0 ? '+' : '';
  return `${sign}${(fraction * 100).toFixed(2)}%`;
}
