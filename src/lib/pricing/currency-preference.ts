import "server-only";
import { cookies, headers } from "next/headers";
import type { CurrencyCode } from "@/lib/money";
import { resolveCurrencyFromSignals } from "./resolve-currency";

/**
 * Server-side currency resolution (Phase 11 §5, §8) — resolved once,
 * server-side, and passed down as a prop, specifically so the initial
 * HTML render already shows the right currency. This is what makes
 * this hydration-safe: the client never independently re-derives a
 * currency that could differ from what the server rendered.
 *
 * The actual priority logic lives in `resolve-currency.ts` (pure,
 * directly unit-tested); this module is just the real I/O boundary —
 * reading the two cookies and Vercel's request-geolocation header.
 *
 * On Vercel, every request is automatically annotated with
 * `x-vercel-ip-country` (a two-letter country code resolved by
 * Vercel's edge network, added with zero configuration). This is NOT
 * browser geolocation — no permission prompt, no client-side API, and
 * this app never reads, logs, or stores the underlying IP address
 * itself, only this already-derived country code, and only
 * transiently for this one decision. Off Vercel (e.g. local dev), the
 * header is simply absent and resolution falls through to the next
 * priority tier.
 *
 * Never stores IP addresses or precise location — only a currency code
 * in a plain, non-sensitive cookie.
 */
export const CURRENCY_COOKIE = "sigma_currency";
export const CURRENCY_OVERRIDE_COOKIE = "sigma_currency_override";
const GEO_COUNTRY_HEADER = "x-vercel-ip-country";

export async function resolveCurrencyPreference(): Promise<CurrencyCode> {
  const cookieStore = await cookies();
  const headerList = await headers();

  return resolveCurrencyFromSignals({
    storedCurrency: cookieStore.get(CURRENCY_COOKIE)?.value,
    isOverride: cookieStore.get(CURRENCY_OVERRIDE_COOKIE)?.value === "true",
    geoCountry: headerList.get(GEO_COUNTRY_HEADER),
  });
}
