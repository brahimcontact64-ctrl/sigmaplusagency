import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/ui/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
  const t = await getTranslations({ locale, namespace: "about" });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}/about`]));

  return {
    title: `${t("title")} — ${siteConfig.name}`,
    description: t("intro"),
    alternates: { canonical: `${siteConfig.url}/${locale}/about`, languages },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const steps = t.raw("process") as { title: string; description: string }[];

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

        <div className="mx-auto max-w-3xl px-6 pb-16">
          <p className="text-lg text-muted">{t("intro")}</p>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-10">
            <h2 className="text-2xl font-bold">{t("processTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("processSubtitle")}</p>
          </div>

          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-border bg-surface p-6">
                <span className="font-mono text-sm font-semibold text-primary-bright">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
