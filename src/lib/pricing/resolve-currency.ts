import { isSupportedCurrency, type CurrencyCode } from "@/lib/money";
import { defaultCurrencyForCountry } from "./country-currency";

/**
 * The pure decision logic behind `currency-preference.ts`'s
 * `resolveCurrencyPreference()` — split out, dependency-free, so the
 * exact priority order (Phase 11 §5) is directly unit-tested without
 * needing `next/headers`'s request-scoped `cookies()`/`headers()`
 * (which only work inside a real Next.js request and can't be
 * imported by Vitest) — same "extract the pure logic" pattern as
 * `rbac.ts`/`site-config-merge.ts`.
 */
export type CurrencySignals = {
  storedCurrency?: string;
  isOverride: boolean;
  geoCountry?: string | null;
};

export function resolveCurrencyFromSignals(signals: CurrencySignals): CurrencyCode {
  if (signals.isOverride && signals.storedCurrency && isSupportedCurrency(signals.storedCurrency)) {
    return signals.storedCurrency;
  }

  if (signals.geoCountry) {
    return defaultCurrencyForCountry(signals.geoCountry);
  }

  if (signals.storedCurrency && isSupportedCurrency(signals.storedCurrency)) {
    return signals.storedCurrency;
  }

  return "EUR";
}
