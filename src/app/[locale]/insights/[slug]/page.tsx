import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircle, Rocket } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/ui/page-hero";
import { ArticleBody } from "@/components/content/article-body";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { TrackedCtaLink } from "@/components/analytics/tracked-cta-link";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { getServiceContent } from "@/content/services";
import { getCaseStudyContent } from "@/content/case-studies";
import { buildCanonicalUrl, buildPartialAlternateLanguages } from "@/lib/seo/site-url";
import { buildArticleSchema, buildOrganizationSchema, withSchemaContext } from "@/lib/seo/schema";
import { getEffectiveSiteConfig } from "@/lib/effective-config";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { effectiveSeoTitle, effectiveSeoDescription } from "@/domain/article";
import type { Locale } from "@/i18n/routing";

// See insights/page.tsx's comment — this route is intentionally dynamic, never statically prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getArticleRepository().findPublishedBySlug(locale, slug);
  if (!result) return {};

  const { translation } = result;
  const publishedInLocales = await getPublishedLocalePaths(result.id);

  return {
    title: `${effectiveSeoTitle(translation)} — SIGMA+`,
    description: effectiveSeoDescription(translation),
    alternates: {
      canonical: buildCanonicalUrl(locale, `/insights/${slug}`),
      languages: buildPartialAlternateLanguages(publishedInLocales),
    },
    openGraph: { title: translation.title, description: translation.description, type: "article" },
  };
}

async function getPublishedLocalePaths(articleId: string): Promise<Partial<Record<Locale, string>>> {
  const translations = await getArticleRepository().getTranslationsForArticle(articleId);
  const paths: Partial<Record<Locale, string>> = {};
  for (const t of translations) {
    if (t.status === "PUBLISHED") paths[t.locale] = `/insights/${t.slug}`;
  }
  return paths;
}

export default async function InsightArticlePage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const result = await getArticleRepository().findPublishedBySlug(locale, slug);

  if (!result) {
    // Slug-change redirect (Phase 8 §15) — resolves to whatever the
    // article's CURRENT slug is right now, never a stale intermediate
    // hop, and only if that translation is still actually published.
    const redirectTarget = await getArticleRepository().resolveRedirect(locale, slug);
    if (redirectTarget) {
      redirect(`/${locale}/insights/${redirectTarget.currentSlug}`);
    }
    notFound();
  }

  const article = result;
  const { translation } = result;
  const t = await getTranslations("insights");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const tServiceDetail = await getTranslations("serviceDetail");
  const tWhatsapp = await getTranslations("whatsappTemplates");

  const effectiveConfig = await getEffectiveSiteConfig();
  const pageUrl = buildCanonicalUrl(locale, `/insights/${slug}`);

  let whatsappUrl: string;
  try {
    whatsappUrl = buildWhatsAppUrl(tWhatsapp("service", { service: translation.title }));
  } catch {
    whatsappUrl = buildWhatsAppUrl();
  }

  const jsonLd = withSchemaContext([
    buildOrganizationSchema(effectiveConfig),
    buildArticleSchema({
      headline: translation.title,
      description: translation.description,
      url: pageUrl,
      datePublished: translation.publishedAt,
      dateModified: translation.updatedAt,
      image: translation.ogImage,
    }),
  ]);

  const relatedServices = article.relatedServices.map((id) => getServiceContent(locale, id));
  const relatedCaseStudies = article.relatedCaseStudies.map((id) => getCaseStudyContent(locale, id));
  const recent = await getArticleRepository().getRecentPublished(locale, 3, article.id);

  return (
    <>
      <JsonLd data={jsonLd} />
      <TrackOnMount event="article_viewed" props={{ articleId: article.id, locale, pageType: "article_detail" }} />
      <SiteHeader locale={locale} />
      <main className="flex-1">
        <PageHero
          locale={locale}
          eyebrow={article.category}
          title={translation.title}
          description={translation.excerpt}
          breadcrumbs={[
            { label: tBreadcrumbs("home"), href: "/" },
            { label: tBreadcrumbs("insights"), href: "/insights" },
            { label: translation.title },
          ]}
        />

        <div className="mx-auto max-w-3xl px-6 pb-24">
          <p className="mb-8 text-sm text-muted">
            {article.author} · {translation.publishedAt && `${t("publishedOn")} ${translation.publishedAt.toLocaleDateString(locale)}`}
          </p>

          <ArticleBody content={translation.content} />

          {(relatedServices.length > 0 || relatedCaseStudies.length > 0) && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {relatedServices.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{tServiceDetail("relatedServicesTitle")}</h2>
                  <ul className="flex flex-col gap-2">
                    {relatedServices.map((s) => (
                      <li key={s.slug}><Link href={`/services/${s.slug}`} className="font-medium text-foreground hover:text-primary-bright">{s.title}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
              {relatedCaseStudies.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{tServiceDetail("relatedProjectsTitle")}</h2>
                  <ul className="flex flex-col gap-2">
                    {relatedCaseStudies.map((c) => (
                      <li key={c.slug}><Link href={`/work/${c.slug}`} className="font-medium text-foreground hover:text-primary-bright">{c.name}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {recent.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{t("title")}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {recent.map((a) => (
                  <Link key={a.translation.id} href={`/insights/${a.translation.slug}`} className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary-bright">
                    <span className="text-xs font-medium text-muted">{a.category}</span>
                    <p className="mt-1 font-semibold text-foreground">{a.translation.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <section className="mt-16 rounded-3xl border border-border bg-surface/60 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">{tServiceDetail("ctaTitle")}</h2>
            <p className="mt-2 text-muted">{tServiceDetail("ctaSubtitle")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <TrackedCtaLink
                href={`/${locale}/start-project`}
                size="lg"
                ctaId="start_project"
                trackProps={{ pageType: "article_detail", articleId: article.id }}
              >
                <Rocket className="size-5" />
                {tServiceDetail("startProjectCta")}
              </TrackedCtaLink>
              <ButtonLink href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg">
                <MessageCircle className="size-5" />
                {tServiceDetail("whatsappCta")}
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
