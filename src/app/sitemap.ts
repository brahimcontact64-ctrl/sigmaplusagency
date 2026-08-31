import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { getAllServiceIds, getServiceSlug } from "@/content/services";
import { getAllProjectIds, getProjectSlug } from "@/content/case-studies";

/**
 * Every canonical public URL, and nothing else — see
 * docs/SEO_STRATEGY.md "Sitemap architecture" / "Indexability matrix".
 * `/admin/*`, the AI chat API route, and every private/session-scoped
 * surface are excluded by construction: this file only ever iterates
 * the same static content maps the public pages themselves render
 * from, so there is no path by which a private route could end up here.
 *
 * `lastModified` is deliberately omitted. No page in this codebase
 * currently carries a real "last edited" timestamp (service/case-study
 * copy lives in versioned TypeScript, not a CMS with per-entry
 * metadata) — inventing one (e.g. `new Date()` at build time, as this
 * file used to do) would fabricate freshness signals the brief
 * explicitly forbids. Add a real `lastModified` per entry once content
 * actually carries one (e.g. from the future blog's `updatedAt`).
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

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  entries.push(fixedPathEntry(""));

  // Fixed-segment pages: the same path resolves in every locale.
  for (const segment of ["/services", "/work", "/about", "/contact", "/start-project", "/ai-consultant"]) {
    entries.push(fixedPathEntry(segment));
  }

  for (const id of getAllServiceIds()) {
    entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, `/services/${getServiceSlug(l, id)}`])) as Record<Locale, string>));
  }

  for (const id of getAllProjectIds()) {
    entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, `/work/${getProjectSlug(l, id)}`])) as Record<Locale, string>));
  }

  // Future blog: only PUBLISHED posts would ever be added here (see
  // src/domain/blog-post.ts) — none exist yet, so nothing to add.

  return entries;
}
