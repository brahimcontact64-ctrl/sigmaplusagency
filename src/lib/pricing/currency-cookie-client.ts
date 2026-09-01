import { isSupportedCurrency, type CurrencyCode } from "@/lib/money";

/**
 * Client-side counterpart to `currency-preference.ts` — same cookie
 * names, so server and client always agree. A plain, non-httpOnly,
 * first-party cookie (same pattern as `consent-store.ts`): client JS
 * needs to read/write it without a server round trip, and it holds
 * nothing more sensitive than a currency code.
 */
const CURRENCY_COOKIE = "sigma_currency";
const CURRENCY_OVERRIDE_COOKIE = "sigma_currency_override";
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60; // 180 days

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

/** The currently persisted currency, if any (may be an auto-derived value, not necessarily an explicit override). */
export function getPersistedCurrency(): CurrencyCode | undefined {
  const value = readCookie(CURRENCY_COOKIE);
  return value && isSupportedCurrency(value) ? value : undefined;
}

/**
 * Records whatever currency was actually shown (server-resolved or
 * client-toggled) as the new "last known" value — this is what backs
 * priority tier 3 (persisted previous choice) the next time a fresh
 * geo signal isn't available. Does NOT mark it as an explicit
 * override; call `setCurrencyOverride` for that.
 */
export function persistShownCurrency(currency: CurrencyCode): void {
  writeCookie(CURRENCY_COOKIE, currency);
}

/** A deliberate, manual choice — always wins on the next resolution, never silently replaced by a geo signal. */
export function setCurrencyOverride(currency: CurrencyCode): void {
  writeCookie(CURRENCY_COOKIE, currency);
  writeCookie(CURRENCY_OVERRIDE_COOKIE, "true");
}
