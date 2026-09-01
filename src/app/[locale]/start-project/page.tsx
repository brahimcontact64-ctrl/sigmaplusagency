import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/ui/page-hero";
import { ProjectBuilder } from "@/components/project-builder/project-builder";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
import { resolveCurrencyPreference } from "@/lib/pricing/currency-preference";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projectBuilder" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    // The Project Builder's own draft/handoff state (?from=ai, localStorage
    // draft) never changes what's canonically indexed — this metadata is
    // identical regardless of query string, so the clean canonical below
    // already prevents ?from=ai from ever becoming a duplicate indexable URL.
    alternates: buildFixedPathAlternates(locale, "/start-project"),
  };
}

export default async function StartProjectPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("projectBuilder");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  // Reading cookies/headers here (Phase 11 §5/§8) makes this route
  // render dynamically per-request rather than at build time — the
  // necessary, deliberate cost of resolving a real, per-visitor
  // currency without a client-side "flash of wrong currency" or a
  // hydration mismatch. Metadata/canonical above are unaffected.
  const currency = await resolveCurrencyPreference();

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <PageHero
          locale={locale}
          eyebrow={t("hero.eyebrow")}
          title={t("hero.title")}
          description={t("hero.subtitle")}
          breadcrumbs={[{ label: tBreadcrumbs("home"), href: "/" }, { label: t("hero.title") }]}
        />

        <div className="mx-auto max-w-3xl px-6 pb-24">
          <Suspense fallback={null}>
            <ProjectBuilder initialCurrency={currency} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
