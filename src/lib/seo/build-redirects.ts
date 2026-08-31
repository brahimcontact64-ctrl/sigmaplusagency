import type { LegacyRedirect } from "@/config/legacy-redirects";
import type { Locale } from "@/i18n/routing";

export type NextRedirectRule = { source: string; destination: string; permanent: true };

/**
 * Pure mapping from the documented legacy-redirect list to Next's
 * `redirects()` config shape, applied per locale directly (source ->
 * final destination, never a chain — see docs/SEO_STRATEGY.md
 * "Redirect system"). Split out from next.config.ts so it's
 * unit-testable without loading the whole Next config (which pulls in
 * the next-intl plugin wrapper).
 */
export function buildLegacyRedirectRules(redirects: LegacyRedirect[], locales: readonly Locale[]): NextRedirectRule[] {
  return redirects.flatMap((redirect) =>
    locales.map((locale) => ({
      source: `/${locale}${redirect.source}`,
      destination: `/${locale}${redirect.destination}`,
      permanent: redirect.permanent,
    })),
  );
}
