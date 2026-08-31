import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

/**
 * `not-found.tsx` receives no props in the App Router (confirmed against
 * the Next.js 16 docs bundled in node_modules — earlier assumptions from
 * training data don't apply here). Locale still resolves correctly
 * without an explicit argument because this renders inside the
 * `[locale]` segment, so `next-intl`'s request-scoped locale (set by
 * `src/proxy.ts` before the route even 404s) is already available.
 *
 * Next.js returns a real HTTP 404 for this special file automatically
 * (whether reached via an unmatched route or an explicit `notFound()`
 * call) — nothing here needs to set the status code itself. Links out
 * to the site's other real commercial pages rather than only Home, per
 * docs/SEO_STRATEGY.md "404 experience".
 */
export default async function NotFound() {
  const [t, tNav, locale] = await Promise.all([
    getTranslations("notFound"),
    getTranslations("nav"),
    getLocale(),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-sm font-semibold text-primary-bright">404</p>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 max-w-md text-muted">{t("description")}</p>
      <ButtonLink href={`/${locale}`} size="lg" className="mt-8">
        {t("cta")}
      </ButtonLink>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
        <ButtonLink href={`/${locale}/services`} variant="ghost" size="md">
          {tNav("services")}
        </ButtonLink>
        <ButtonLink href={`/${locale}/work`} variant="ghost" size="md">
          {tNav("work")}
        </ButtonLink>
        <ButtonLink href={`/${locale}/start-project`} variant="ghost" size="md">
          {tNav("startProject")}
        </ButtonLink>
      </div>
    </div>
  );
}
