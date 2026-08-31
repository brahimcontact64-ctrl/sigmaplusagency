import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/admin/empty-state";
import { Link } from "@/i18n/navigation";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { buildFixedPathAlternates } from "@/lib/seo/site-url";
import { ARTICLE_CATEGORIES } from "@/domain/article";
import type { Locale } from "@/i18n/routing";

// Published articles are DB-backed and edited live through the admin
// CMS — this route is intentionally dynamic (fresh on every request),
// not statically prerendered, so a newly published article appears
// without a redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insights" });
  return {
    title: `${t("title")} — SIGMA+`,
    description: t("subtitle"),
    alternates: buildFixedPathAlternates(locale, "/insights"),
  };
}

const PAGE_SIZE = 12;

export default async function InsightsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { category: rawCategory, page: rawPage } = await searchParams;
  const category = rawCategory && (ARTICLE_CATEGORIES as readonly string[]).includes(rawCategory) ? (rawCategory as (typeof ARTICLE_CATEGORIES)[number]) : undefined;
  const page = Math.max(1, Number(rawPage ?? "1") || 1);

  const t = await getTranslations("insights");
  const tBreadcrumbs = await getTranslations("breadcrumbs");
  const repo = getArticleRepository();

  const [featured, { items, total }] = await Promise.all([
    category ? Promise.resolve([]) : repo.getFeaturedPublished(locale, 1),
    repo.listPublished(locale, { category }, page, PAGE_SIZE),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const featuredArticle = featured[0];
  const listArticles = items.filter((a) => a.id !== featuredArticle?.id);

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
          {/* Category nav — canonical always points at the clean /insights index (no query-param duplicate indexing, see docs/SEO_STRATEGY.md "Facet indexing"). */}
          <nav className="mb-10 flex flex-wrap gap-2">
            <Link
              href="/insights"
              className={`rounded-full border px-3 py-1.5 text-sm ${!category ? "border-primary-bright text-primary-bright" : "border-border text-muted hover:text-foreground"}`}
            >
              {t("allCategories")}
            </Link>
            {ARTICLE_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/insights?category=${c}`}
                className={`rounded-full border px-3 py-1.5 text-sm ${category === c ? "border-primary-bright text-primary-bright" : "border-border text-muted hover:text-foreground"}`}
              >
                {c}
              </Link>
            ))}
          </nav>

          {items.length === 0 ? (
            <EmptyState title={t("empty")} hint={t("emptyHint")} />
          ) : (
            <>
              {featuredArticle && (
                <Link
                  href={`/insights/${featuredArticle.translation.slug}`}
                  className="mb-10 flex flex-col gap-3 rounded-3xl border border-border bg-surface p-8 transition-colors hover:border-primary-bright"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-bright">{t("featured")}</span>
                  <h2 className="text-2xl font-bold text-foreground">{featuredArticle.translation.title}</h2>
                  <p className="text-muted">{featuredArticle.translation.excerpt}</p>
                </Link>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listArticles.map((article) => (
                  <Link
                    key={article.translation.id}
                    href={`/insights/${article.translation.slug}`}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary-bright"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-muted">{article.category}</span>
                    <h3 className="text-lg font-semibold text-foreground">{article.translation.title}</h3>
                    <p className="text-sm text-muted">{article.translation.excerpt}</p>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/insights${category ? `?category=${category}&` : "?"}page=${p}`}
                      className={`rounded-lg border px-3 py-1.5 ${p === page ? "border-primary-bright text-primary-bright" : "border-border hover:text-foreground"}`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
