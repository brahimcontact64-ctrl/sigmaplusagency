/**
 * Deal value handling (Phase 9 §67) — integer minor units only, never
 * a float, always paired with an explicit currency. `100` EUR is
 * stored as `10000` minor units (cents), matching how Stripe and most
 * payment infrastructure represent money, and avoiding the classic
 * `0.1 + 0.2 !== 0.3` class of bug entirely by never doing floating-
 * point arithmetic on money in the first place.
 */
export const SUPPORTED_CURRENCIES = ["EUR", "USD", "DZD", "GBP", "CHF"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** Converts a major-unit decimal string/number (what a human types into a form, e.g. "1500.50") into an exact integer minor-unit count — does the rounding once, at the boundary, never downstream. */
export function toMinorUnits(majorAmount: number): number {
  if (!Number.isFinite(majorAmount) || majorAmount < 0) {
    throw new RangeError("Deal value must be a finite, non-negative number.");
  }
  return Math.round(majorAmount * 100);
}

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/** Formats minor units for display — Intl.NumberFormat does the currency-specific decimal handling correctly (not every currency has 2 minor-unit digits, though all of SUPPORTED_CURRENCIES here do). */
export function formatMoney(minorUnits: number, currency: CurrencyCode, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(fromMinorUnits(minorUnits));
}
