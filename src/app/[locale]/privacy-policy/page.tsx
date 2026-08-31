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
    title: `${t("privacy.title")} — ${siteConfig.name}`,
    description: t("privacy.intro"),
    alternates: buildFixedPathAlternates(locale, "/privacy-policy"),
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const sections = t.raw("privacy.sections") as { heading: string; body: string }[];

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <PageHero
          locale={locale}
          title={t("privacy.title")}
          description={t("privacy.intro")}
          breadcrumbs={[{ label: tBreadcrumbs("home"), href: "/" }, { label: t("privacy.title") }]}
        />
        <LegalPageBody
          intro={t("privacy.intro")}
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
