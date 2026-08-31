import { NextResponse } from "next/server";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { getEffectiveSiteConfig } from "@/lib/effective-config";
import { buildCanonicalUrl } from "@/lib/seo/site-url";
import { locales, type Locale } from "@/i18n/routing";

const MAX_ITEMS = 50;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * A localized RSS feed of PUBLISHED Insights articles only (Phase 8
 * §59) — genuinely low-cost, so it shipped rather than being deferred:
 * this is a plain Route Handler generating valid XML from a DB query
 * this codebase already had (`listPublished`), no new dependency.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 404 });
  }
  const locale = rawLocale as Locale;

  const config = await getEffectiveSiteConfig();
  const { items } = await getArticleRepository().listPublished(locale, {}, 1, MAX_ITEMS);

  const feedUrl = buildCanonicalUrl(locale, "/insights/rss.xml");
  const siteUrl = buildCanonicalUrl(locale, "/insights");

  const itemsXml = items
    .map((article) => {
      const url = buildCanonicalUrl(locale, `/insights/${article.translation.slug}`);
      const pubDate = (article.translation.publishedAt ?? article.translation.updatedAt).toUTCString();
      return `    <item>
      <title>${escapeXml(article.translation.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(article.translation.excerpt || article.translation.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(config.name)} Insights</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(config.legalName)} — Insights</description>
    <language>${locale}</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
