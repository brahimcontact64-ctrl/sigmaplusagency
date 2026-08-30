import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/ui/page-hero";
import { ProjectBuilder } from "@/components/project-builder/project-builder";
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
  const t = await getTranslations({ locale, namespace: "projectBuilder" });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}/start-project`]));

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `${siteConfig.url}/${locale}/start-project`, languages },
  };
}

export default async function StartProjectPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("projectBuilder");
  const tBreadcrumbs = await getTranslations("breadcrumbs");

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
          <ProjectBuilder />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
