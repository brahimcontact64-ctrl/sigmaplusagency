import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/ui/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalPageBody } from "@/components/legal/legal-page-body";
import { siteConfig } from "@/lib/site-config";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  return {
    title: `${t("terms.title")} — ${siteConfig.name}`,
    description: t("terms.intro"),
    alternates: buildFixedPathAlternates(locale, "/terms"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const sections = t.raw("terms.sections") as { heading: string; body: string }[];

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <PageHero
          locale={locale}
          title={t("terms.title")}
          description={t("terms.intro")}
          breadcrumbs={[{ label: tBreadcrumbs("home"), href: "/" }, { label: t("terms.title") }]}
        />
        <LegalPageBody
          intro={t("terms.intro")}
          sections={sections}
          draftNotice={t("draftNotice")}
          lastUpdatedLabel={t("lastUpdatedLabel")}
          lastUpdatedValue={t("lastUpdatedValue")}
        />
      </main>
      <SiteFooter />
    </>
  );
}
