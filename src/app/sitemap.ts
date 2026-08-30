import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { getAllServiceIds, getServiceSlug } from "@/content/services";
import { getAllProjectIds, getProjectSlug } from "@/content/case-studies";

function entry(pathByLocale: Record<string, string>): MetadataRoute.Sitemap[number] {
  const [firstLocale] = routing.locales;
  return {
    url: `${siteConfig.url}/${firstLocale}${pathByLocale[firstLocale]}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteConfig.url}/${l}${pathByLocale[l]}`]),
      ),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home
  entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, ""]))));

  // Static top-level pages (fixed segment name across all locales)
  for (const segment of ["/services", "/work", "/about", "/contact", "/start-project"]) {
    entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, segment]))));
  }

  // Service detail pages
  for (const id of getAllServiceIds()) {
    entries.push(
      entry(Object.fromEntries(routing.locales.map((l) => [l, `/services/${getServiceSlug(l, id)}`]))),
    );
  }

  // Case study detail pages
  for (const id of getAllProjectIds()) {
    entries.push(entry(Object.fromEntries(routing.locales.map((l) => [l, `/work/${getProjectSlug(l, id)}`]))));
  }

  return entries;
}
