import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { getAllServiceIds, getServiceSlug } from "@/content/services";
import { getAllProjectIds, getProjectSlug } from "@/content/case-studies";
import { getArticleRepository, type ArticleRepository } from "@/lib/repositories/article-repository";
import { buildCanonicalUrl, buildPartialAlternateLanguages } from "@/lib/seo/site-url";

/**
 * Every canonical public URL, and nothing else — see
 * docs/SEO_STRATEGY.md "Sitemap architecture" / "Indexability matrix".
 * `/admin/*`, the AI chat API route, and every private/session-scoped
 * surface are excluded by construction: this file only ever iterates
 * the same static content maps the public pages themselves render
 * from, so there is no path by which a private route could end up here.
 *
 * `lastModified` is omitted for static content (service/case-study
 * copy lives in versioned TypeScript, no per-entry timestamp exists —
 * inventing one would fabricate a freshness signal). Insights articles
 * are the first content type with a genuine timestamp
 * (`article_translations.updated_at`) — see `articleEntries` below,
 * which uses it for real.
 */
function entry(pathByLocale: Record<Locale, string>): MetadataRoute.Sitemap[number] {
  const [firstLocale] = routing.locales;
  return {
    url: `${siteConfig.url}/${firstLocale}${pathByLocale[firstLocale]}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteConfig.url}/${l}${pathByLocale[l]}`]),
      ),
    },
  };
}

function fixedPathEntry(path: string): MetadataRoute.Sitemap[number] {
  return entry(Object.fromEntries(routing.locales.map((l) => [l, path])) as Record<Locale, string>);
}

/** The static-content half of the sitemap — zero DB dependency, so it's the part directly unit-tested without touching any database (real or test). */
export function buildStaticSitemapEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  entries.push(fixedPathEntry(""));

  for (const segment of ["/services", "/work", "/about", "/contact", "/start-project", "/ai-consultant", "/insights"]) {
    entries.push(fixedPathEntry(segment));
  }

  for (const id of getAllServiceIds()) {
    entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, `/services/${getServiceSlug(l, id)}`])) as Record<Locale, string>));
  }

  for (const id of getAllProjectIds()) {
    entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, `/work/${getProjectSlug(l, id)}`])) as Record<Locale, string>));
  }

  return entries;
}

/**
 * Published Insights articles only — a DRAFT/REVIEW/ARCHIVED
 * translation structurally cannot appear here, since
 * `listAllPublishedTranslations()`'s own query filters to PUBLISHED.
 * Each article gets one sitemap entry per published locale peer (not
 * one per locale regardless — see `buildPartialAlternateLanguages`),
 * and a real `lastModified` from that translation's own `updatedAt`.
 * A database failure here must never take down the rest of the
 * sitemap — caught and logged, not thrown. Takes an injectable
 * repository so tests can pass an isolated `createTestArticleRepository`
 * instance instead of hitting the real dev/production database.
 */
export async function articleEntries(repo: ArticleRepository = getArticleRepository()): Promise<MetadataRoute.Sitemap> {
  // Same guard as effective-config.ts: a production build/runtime with
  // no DATABASE_URL is an already-documented, expected state (every
  // real write path throws the same way) — skip the doomed call
  // instead of logging the same caught stack trace on every build.
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) return [];

  try {
    const published = await repo.listAllPublishedTranslations();
    const byArticle = new Map<string, typeof published>();
    for (const item of published) byArticle.set(item.id, [...(byArticle.get(item.id) ?? []), item]);

    const entries: MetadataRoute.Sitemap = [];
    for (const translations of byArticle.values()) {
      const pathByLocale: Partial<Record<Locale, string>> = {};
      let latestUpdatedAt: Date | null = null;
      for (const item of translations) {
        pathByLocale[item.translation.locale] = `/insights/${item.translation.slug}`;
        if (!latestUpdatedAt || item.translation.updatedAt > latestUpdatedAt) latestUpdatedAt = item.translation.updatedAt;
      }

      const primaryLocale = routing.locales.find((l) => pathByLocale[l] !== undefined);
      if (!primaryLocale) continue;

      entries.push({
        url: buildCanonicalUrl(primaryLocale, pathByLocale[primaryLocale]!),
        lastModified: latestUpdatedAt ?? undefined,
        alternates: { languages: buildPartialAlternateLanguages(pathByLocale) },
      });
    }
    return entries;
  } catch (error) {
    console.error("[sitemap] could not include Insights articles (database unavailable?):", error);
    return [];
  }
}

// Force-dynamic rather than the default static-optimized metadata
// route: Insights articles are live CMS content, and a statically
// generated sitemap.xml would only ever reflect whatever existed at
// the last deploy — a newly published article must appear in the real
// sitemap without a redeploy, same reasoning as the Insights pages
// themselves (see insights/page.tsx).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...buildStaticSitemapEntries(), ...(await articleEntries())];
}
