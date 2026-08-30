import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, MessageCircle, Rocket } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getAllServiceIds,
  getServiceBySlug,
  getServiceContent,
  getServiceMeta,
  getServiceSlug,
} from "@/content/services";
import { getFeaturedProjects, getCaseStudyContent, getProjectSlug, caseStudiesMeta } from "@/content/case-studies";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/site-config";
import { routing, type Locale } from "@/i18n/routing";

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  return getAllServiceIds().map((id) => ({ slug: getServiceSlug(locale, id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const id = getServiceBySlug(locale, slug);
  if (!id) return {};

  const content = getServiceContent(locale, id);
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${siteConfig.url}/${l}/services/${getServiceSlug(l, id)}`]),
  );

  return {
    title: `${content.title} — ${siteConfig.name}`,
    description: content.positioning,
    alternates: { canonical: `${siteConfig.url}/${locale}/services/${slug}`, languages },
    openGraph: { title: content.title, description: content.positioning, type: "website" },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const id = getServiceBySlug(locale, slug);
  if (!id) notFound();

  const content = getServiceContent(locale, id);
  const meta = getServiceMeta(id);

  const t = await getTranslations("serviceDetail");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const tWhatsapp = await getTranslations("whatsappTemplates");

  const whatsappUrl = buildWhatsAppUrl(tWhatsapp("service", { service: content.title }));

  const relatedProjectIds = getFeaturedProjects().filter((pid) => caseStudiesMeta[pid].services.includes(id));

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: content.title,
    description: content.description,
    provider: { "@type": "ProfessionalService", name: siteConfig.legalName, url: siteConfig.url },
    areaServed: ["DZ", "FR", "DE", "AE"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <SiteHeader locale={locale} />

      <main className="flex-1">
        <PageHero
          locale={locale}
          eyebrow={content.positioning}
          title={content.title}
          description={content.description}
          breadcrumbs={[
            { label: tBreadcrumbs("home"), href: "/" },
            { label: tBreadcrumbs("services"), href: "/services" },
            { label: content.title },
          ]}
        />

        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-12 lg:col-span-2">
              <section>
                <h2 className="text-xl font-bold">{t("problemsTitle")}</h2>
                <ul className="mt-4 space-y-3">
                  {content.problems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-bright" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold">{t("deliverablesTitle")}</h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {content.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary-bright" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold">{t("capabilitiesTitle")}</h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {content.capabilities.map((item) => (
                    <li key={item} className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {content.faq.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold">{t("faqTitle")}</h2>
                  <FaqAccordion items={content.faq} />
                </section>
              )}
            </div>

            <aside className="space-y-8">
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("technologiesTitle")}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {meta.technologies.map((tech) => (
                    <span key={tech} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {content.industries.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("industriesTitle")}</h2>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {content.industries.map((industry) => (
                      <li key={industry}>{industry}</li>
                    ))}
                  </ul>
                </div>
              )}

              {meta.relatedServices.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {t("relatedServicesTitle")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {meta.relatedServices.map((relId) => {
                      const relContent = getServiceContent(locale, relId);
                      return (
                        <li key={relId}>
                          <Link
                            href={`/services/${relContent.slug}`}
                            className="text-sm font-medium text-foreground hover:text-primary-bright"
                          >
                            {relContent.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {relatedProjectIds.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {t("relatedProjectsTitle")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {relatedProjectIds.map((pid) => {
                      const project = getCaseStudyContent(locale, pid);
                      return (
                        <li key={pid}>
                          <Link
                            href={`/work/${getProjectSlug(locale, pid)}`}
                            className="text-sm font-medium text-foreground hover:text-primary-bright"
                          >
                            {project.name}
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
                {t("startProjectCta")}
              </ButtonLink>
              <ButtonLink href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg">
                <MessageCircle className="size-5" />
                {t("whatsappCta")}
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
