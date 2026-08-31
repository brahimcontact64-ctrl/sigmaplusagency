import { siteConfig } from "@/lib/site-config";
import { routing, type Locale } from "@/i18n/routing";

/**
 * The one canonical URL/hreflang resolver — see docs/SEO_STRATEGY.md
 * "Canonical URL system". No page should assemble
 * `${siteConfig.url}/${locale}${path}` inline; every generateMetadata
 * in this codebase goes through these two functions instead, so the
 * production origin, locale prefix, and x-default policy only exist
 * in one place.
 *
 * `siteConfig.url` (NEXT_PUBLIC_SITE_URL) is deliberately NOT read from
 * the DB-backed effective-config — site origin is infrastructure, not
 * business-editable content, and must stay stable/synchronous for
 * every generateMetadata call.
 */

/** Algeria-first launch — French is next-intl's own defaultLocale, so x-default matches it rather than an unrelated third choice. Documented in docs/SEO_STRATEGY.md "hreflang policy". */
export const X_DEFAULT_LOCALE: Locale = routing.defaultLocale;

export function buildCanonicalUrl(locale: Locale, path: string = ""): string {
  return `${siteConfig.url}/${locale}${path}`;
}

/** `pathByLocale` must be the correctly *localized-slug* path for each locale (e.g. different service slugs per language) — never a single shared slug reused across locales. */
export function buildAlternateLanguages(pathByLocale: Record<Locale, string>): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = buildCanonicalUrl(locale, pathByLocale[locale]);
  }
  languages["x-default"] = buildCanonicalUrl(X_DEFAULT_LOCALE, pathByLocale[X_DEFAULT_LOCALE]);
  return languages;
}

/**
 * Insights articles (Phase 8) may not have a translation in every
 * locale yet — never fabricate a route for one that doesn't exist
 * (§9/§16: "hreflang should include only actual published peers").
 * `x-default` points at the default locale's URL when published,
 * otherwise falls back to whichever published locale sorts first in
 * `routing.locales` order, so there's always at least one x-default
 * rather than omitting it just because French isn't the published one.
 */
export function buildPartialAlternateLanguages(publishedPathByLocale: Partial<Record<Locale, string>>): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const path = publishedPathByLocale[locale];
    if (path !== undefined) languages[locale] = buildCanonicalUrl(locale, path);
  }

  const defaultPath = publishedPathByLocale[X_DEFAULT_LOCALE];
  if (defaultPath !== undefined) {
    languages["x-default"] = buildCanonicalUrl(X_DEFAULT_LOCALE, defaultPath);
  } else {
    const firstPublishedLocale = routing.locales.find((l) => publishedPathByLocale[l] !== undefined);
    if (firstPublishedLocale) languages["x-default"] = buildCanonicalUrl(firstPublishedLocale, publishedPathByLocale[firstPublishedLocale]!);
  }

  return languages;
}

/** Convenience for the common case: a page whose path segment is identical across every locale (contact, about, services/work index, start-project, ai-consultant). */
export function buildFixedPathAlternates(
  locale: Locale,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const fixed = Object.fromEntries(routing.locales.map((l) => [l, path])) as Record<Locale, string>;
  return { canonical: buildCanonicalUrl(locale, path), languages: buildAlternateLanguages(fixed) };
}
