import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAllServiceIds, getServiceContent } from "@/content/services";
import { SERVICE_CATEGORY_IDS, getServiceCategory, type ServiceCategoryId } from "@/domain/service";
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
  const t = await getTranslations({ locale, namespace: "servicesPage" });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}/services`]));

  return {
    title: `${t("title")} — ${siteConfig.name}`,
    description: t("subtitle"),
    alternates: { canonical: `${siteConfig.url}/${locale}/services`, languages },
  };
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("servicesPage");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const ids = getAllServiceIds();

  const byCategory: Record<ServiceCategoryId, typeof ids[number][]> = {
    build: [],
    intelligence: [],
    experience: [],
    infrastructure: [],
  };
  for (const id of ids) byCategory[getServiceCategory(id)].push(id);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <PageHero
          locale={locale}
          title={t("title")}
          description={t("subtitle")}
          breadcrumbs={[{ label: tBreadcrumbs("home"), href: "/" }, { label: t("title") }]}
        />

        <div className="mx-auto max-w-6xl space-y-16 px-6 pb-24">
          {SERVICE_CATEGORY_IDS.map((category) => (
            <section key={category}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{t(`categories.${category}.label`)}</h2>
                <p className="mt-1 text-sm text-muted">{t(`categories.${category}.description`)}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {byCategory[category].map((id) => {
                  const content = getServiceContent(locale, id);
                  return (
                    <Link
                      key={id}
                      href={`/services/${content.slug}`}
                      className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary-bright"
                    >
                      <div>
                        <h3 className="text-lg font-semibold">{content.title}</h3>
                        <p className="mt-2 text-sm text-muted">{content.positioning}</p>
                      </div>
                      <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-bright">
                        {t("seeAll")}
                        <ArrowRight className="size-4 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
