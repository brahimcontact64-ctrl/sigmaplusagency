import type { CurrencyCode } from "@/lib/money";

/**
 * Country → default display currency (Phase 11 §5-6). Deliberately
 * NOT derived from the visitor's selected language — a French speaker
 * can be in Algeria, France, Belgium, or Canada, and language alone
 * says nothing about which currency is locally meaningful. Only a
 * real country signal (§ below) drives this.
 *
 * Extend this map for future markets (e.g. AE → AED, GB → GBP) as
 * they're actually launched — every currency here must already exist
 * in `SUPPORTED_CURRENCIES` (src/lib/money.ts).
 */
const COUNTRY_DEFAULT_CURRENCY: Partial<Record<string, CurrencyCode>> = {
  DZ: "DZD",
};

const FALLBACK_CURRENCY: CurrencyCode = "EUR";

/** `countryCode` is a two-letter ISO code (e.g. from a trusted request-geolocation signal) or undefined/unknown. Never guesses from language, IP, or anything else. */
export function defaultCurrencyForCountry(countryCode: string | null | undefined): CurrencyCode {
  if (!countryCode) return FALLBACK_CURRENCY;
  return COUNTRY_DEFAULT_CURRENCY[countryCode.trim().toUpperCase()] ?? FALLBACK_CURRENCY;
}
