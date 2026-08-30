import { defineRouting } from 'next-intl/routing';

export const locales = ['fr', 'ar', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const rtlLocales: ReadonlySet<Locale> = new Set(['ar']);

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // We use localized per-locale slugs (e.g. /ar/services/تطوير-الويب vs
  // /fr/services/developpement-web), but next-intl's automatic `Link`
  // response header just swaps the locale segment on the current
  // pathname — it doesn't know about localized slugs, so it emits wrong
  // alternate URLs. We already emit correct hreflang <link> tags per
  // page via generateMetadata's `alternates.languages`, so disable the
  // header here rather than ship a self-contradicting hreflang signal.
  alternateLinks: false,
});
