import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check, MessageCircle, Rocket } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProjectVisual } from "@/components/case-study/project-visual";
import {
  getAllProjectIds,
  getProjectBySlug,
  getCaseStudyContent,
  getCaseStudyMeta,
  getProjectSlug,
} from "@/content/case-studies";
import { getServiceContent } from "@/content/services";
import { PROJECT_IDS } from "@/domain/case-study";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/site-config";
import { buildCanonicalUrl, buildAlternateLanguages } from "@/lib/seo/site-url";
import { buildCaseStudySchema, withSchemaContext } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/json-ld";
import { routing, type Locale } from "@/i18n/routing";

const ACCENTS: Record<string, string> = {
  saheat: "#5B8CFF",
  "e-vizza": "#22C7D9",
  "eleman-shoes": "#7C6FFF",
  dzenix: "#5B8CFF",
};

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  return getAllProjectIds().map((id) => ({ slug: getProjectSlug(locale, id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const id = getProjectBySlug(locale, slug);
  if (!id) return {};

  const content = getCaseStudyContent(locale, id);
  const languages = buildAlternateLanguages(
    Object.fromEntries(routing.locales.map((l) => [l, `/work/${getProjectSlug(l, id)}`])) as Record<Locale, string>,
  );

  return {
    title: `${content.name} — ${siteConfig.name}`,
    description: content.summary,
    alternates: { canonical: buildCanonicalUrl(locale, `/work/${slug}`), languages },
    openGraph: { title: content.name, description: content.summary, type: "article" },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const id = getProjectBySlug(locale, slug);
  if (!id) notFound();

  const content = getCaseStudyContent(locale, id);
  const meta = getCaseStudyMeta(id);
  const accent = ACCENTS[id] ?? "#5B8CFF";

  const t = await getTranslations("caseStudy");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const tWhatsapp = await getTranslations("whatsappTemplates");
  const tCta = await getTranslations("serviceDetail");

  const whatsappUrl = buildWhatsAppUrl(tWhatsapp("project", { project: content.name }));

  const currentIndex = PROJECT_IDS.indexOf(id);
  const nextId = PROJECT_IDS[(currentIndex + 1) % PROJECT_IDS.length];
  const nextContent = getCaseStudyContent(locale, nextId);

  const narrativeSections: { title: string; text: string }[] = [];
  if (content.narrative.challenge) narrativeSections.push({ title: t("challengeTitle"), text: content.narrative.challenge });
  if (content.narrative.strategy) narrativeSections.push({ title: t("strategyTitle"), text: content.narrative.strategy });
  if (content.narrative.implementation)
    narrativeSections.push({ title: t("implementationTitle"), text: content.narrative.implementation });
  if (content.narrative.qualitativeOutcome)
    narrativeSections.push({ title: t("outcomeTitle"), text: content.narrative.qualitativeOutcome });

  const jsonLd = withSchemaContext(
    buildCaseStudySchema({
      name: content.name,
      description: content.summary,
      url: buildCanonicalUrl(locale, `/work/${slug}`),
    }),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader locale={locale} />

      <main className="flex-1">
        <PageHero
          locale={locale}
          eyebrow={content.tag}
          title={content.name}
          description={content.tagline}
          breadcrumbs={[
            { label: tBreadcrumbs("home"), href: "/" },
            { label: tBreadcrumbs("work"), href: "/work" },
            { label: content.name },
          ]}
        />

        <div className="mx-auto max-w-6xl px-6 pb-24">
          <ProjectVisual name={content.name} accent={accent} />

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-12 lg:col-span-2">
              <section>
                <h2 className="text-xl font-bold">{t("whatItIsTitle")}</h2>
                <p className="mt-4 text-muted">{content.whatItIs}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold">{t("coreFunctionalityTitle")}</h2>
                <ul className="mt-4 space-y-3">
                  {content.coreFunctionality.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary-bright" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {narrativeSections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  <p className="mt-4 text-muted">{section.text}</p>
                </section>
              ))}
            </div>

            <aside className="space-y-8">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-muted">{t("statusLabel")}</dt>
                    <dd className="mt-1">{meta.status === "delivered" ? t("statusDelivered") : meta.status}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-muted">{t("industryLabel")}</dt>
                    <dd className="mt-1">{meta.industry}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-muted">{t("platformsTitle")}</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {meta.platforms.map((p) => (
                        <span key={p} className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                          {p}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>

              {meta.services.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {t("relatedServicesTitle")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {meta.services.map((sid) => {
                      const service = getServiceContent(locale, sid);
                      return (
                        <li key={sid}>
                          <Link
                            href={`/services/${service.slug}`}
                            className="text-sm font-medium text-foreground hover:text-primary-bright"
                          >
                            {service.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </aside>
          </div>

          <section className="mt-16 rounded-3xl border border-border bg-surface/60 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
            <p className="mt-2 text-muted">{t("ctaSubtitle")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ButtonLink href={`/${locale}/start-project`} size="lg">
                <Rocket className="size-5" />
                {tCta("startProjectCta")}
              </ButtonLink>
              <ButtonLink href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg">
                <MessageCircle className="size-5" />
                {tCta("whatsappCta")}
              </ButtonLink>
            </div>
          </section>

          <div className="mt-12 flex justify-end">
            <Link
              href={`/work/${nextContent.slug}`}
              className="group flex items-center gap-3 text-right"
            >
              <span>
                <span className="block text-xs uppercase tracking-wide text-muted">{t("nextProjectLabel")}</span>
                <span className="text-lg font-bold">{nextContent.name}</span>
              </span>
              <ArrowRight className="size-5 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
