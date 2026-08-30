import { defineRouting } from 'next-intl/routing';

export const locales = ['fr', 'ar', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const rtlLocales: ReadonlySet<Locale> = new Set(['ar']);

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
