import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/ui/page-hero";
import { AiConsultantPanel } from "@/components/ai-consultant/ai-consultant-panel";
import { isAIConfigured } from "@/lib/ai/get-provider";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
import { isProductionDeployment } from "@/lib/deployment";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";
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
  const t = await getTranslations({ locale, namespace: "aiConsultant" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: buildFixedPathAlternates(locale, "/ai-consultant"),
    // A conversation held here is per-visitor and never indexable content — the
    // static intro copy is fine to index, the chat itself has no crawlable URL
    // (conversationId lives only in sessionStorage + POST bodies, never a URL).
    // Still deferring to the site-wide preview/dev noindex default (Phase 10
    // §8-9) rather than unconditionally overriding it with index:true.
    robots: isProductionDeployment() ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function AiConsultantPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aiConsultant");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  // Maintenance mode disables AI consultation the same as a missing
  // API key would — the visitor sees the same honest "temporarily
  // unavailable" state either way (Phase 10 §30).
  const available = isAIConfigured() && !isMaintenanceModeEnabled();

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

        <div className="mx-auto max-w-5xl px-6 pb-24">
          <AiConsultantPanel locale={locale} available={available} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
