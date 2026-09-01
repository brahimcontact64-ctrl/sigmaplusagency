import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAllProjectIds, getCaseStudyContent, caseStudiesMeta } from "@/content/case-studies";
import { siteConfig } from "@/lib/site-config";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
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
  const t = await getTranslations({ locale, namespace: "workPage" });

  return {
    title: `${t("title")} — ${siteConfig.name}`,
    description: t("subtitle"),
    alternates: buildFixedPathAlternates(locale, "/work"),
  };
}

const ACCENTS = ["#5B8CFF", "#22C7D9", "#7C6FFF", "#5B8CFF"];

export default async function WorkIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("workPage");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const ids = getAllProjectIds();

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

        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {ids.map((id, i) => {
              const content = getCaseStudyContent(locale, id);
              const meta = caseStudiesMeta[id];
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <Link
                  key={id}
                  href={`/work/${content.slug}`}
                  // Deliberate mobile card composition (Phase 11 §3),
                  // not an inherited desktop size: tighter padding and
                  // a smaller decorative number at small widths, back
                  // to the original generous spacing from `sm:` up.
                  // No image-sized space is reserved anywhere here —
                  // this codebase never uses project imagery, by design.
                  className="group relative overflow-hidden rounded-2xl border border-border bg-graphite p-5 transition-colors hover:border-[--accent] sm:p-8"
                  style={{ ["--accent" as string]: accent }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-4 select-none font-mono text-5xl font-bold leading-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1] rtl:-left-3 rtl:right-auto sm:-right-4 sm:-top-6 sm:text-[6rem] rtl:sm:-left-4"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                      style={{ borderColor: accent, color: accent }}
                    >
                      {content.tag}
                    </span>
                    <span className="text-xs font-medium text-muted">
                      {meta.status === "delivered" ? t("statusDelivered") : null}
                    </span>
                  </div>

                  <h2 className="relative mt-3 text-xl font-bold sm:mt-4">{content.name}</h2>
                  <p className="relative mt-2 max-w-sm text-sm text-muted sm:mt-3">{content.summary}</p>

                  <span className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-primary-bright sm:mt-6">
                    {t("viewCaseStudy")}
                    <ArrowRight className="size-4 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
