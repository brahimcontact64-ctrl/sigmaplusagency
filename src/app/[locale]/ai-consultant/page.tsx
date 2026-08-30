import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/ui/page-hero";
import { AiConsultantPanel } from "@/components/ai-consultant/ai-consultant-panel";
import { isAIConfigured } from "@/lib/ai/get-provider";
import { siteConfig } from "@/lib/site-config";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aiConsultant" });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}/ai-consultant`]));

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${siteConfig.url}/${locale}/ai-consultant`, languages },
    // A conversation held here is per-visitor and never indexable content — the
    // static intro copy is fine to index, the chat itself has no crawlable URL.
    robots: { index: true, follow: true },
  };
}

export default async function AiConsultantPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aiConsultant");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const available = isAIConfigured();

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
