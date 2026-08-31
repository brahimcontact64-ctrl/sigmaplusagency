export const CONSENT_CATEGORIES = ["ESSENTIAL", "ANALYTICS", "MARKETING"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export type ConsentPreferences = { analytics: boolean; marketing: boolean };

const COOKIE_NAME = "sigma_consent";
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60; // 180 days

/**
 * Consent architecture (Phase 9 §29-30). `ESSENTIAL` (core site
 * function — page rendering, form submission, the actual lead
 * persistence) is never gated by this and isn't represented here at
 * all, since it's not optional. `ANALYTICS` gates first-party funnel
 * event persistence; `MARKETING` gates the optional GA4 outbound
 * adapter. A plain, non-httpOnly, first-party cookie (client JS needs
 * to read it to decide whether to fire `track()`'s network call at
 * all) — no server round-trip needed to store a preference toggle.
 *
 * This is NOT a legal compliance certification — see
 * docs/PRODUCTION_OPERATIONS.md's explicit note that final consent/
 * cookie requirements depend on the launch market and need real legal
 * review before broad launch.
 */
export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]!)) as Partial<ConsentPreferences>;
    return { analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing) };
  } catch {
    return null;
  }
}

export function setConsentPreferences(prefs: ConsentPreferences): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentPreferences()?.analytics ?? false;
}

export function hasMarketingConsent(): boolean {
  return getConsentPreferences()?.marketing ?? false;
}
