import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { isProductionDeployment } from "@/lib/deployment";

/**
 * robots.txt is defense-in-depth, never the actual security boundary
 * — /admin is genuinely protected by authentication (src/lib/auth/dal.ts)
 * regardless of what this file says; a rule here only asks well-behaved
 * crawlers not to bother, it doesn't stop anyone. See
 * docs/SEO_STRATEGY.md "Robots.txt" / "Indexability matrix" for the
 * full policy this mirrors.
 *
 * Phase 10 §9: a preview deployment must never be crawlable — disallow
 * everything and omit the sitemap reference entirely rather than
 * pointing crawlers at a preview URL's sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
