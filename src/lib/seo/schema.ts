import { siteConfig } from "@/lib/site-config";
import type { EffectiveSiteConfig } from "@/lib/site-config-merge";

/**
 * Centralized, truthful structured-data builders — see
 * docs/SEO_STRATEGY.md "Structured data policy". Nothing here invents
 * a review, rating, employee count, founding date, award, or social
 * profile; every field is either static verified copy or a value
 * that's already rendered visibly on the page. Entities cross-reference
 * each other via stable `@id` values instead of repeating the full
 * Organization object on every page.
 */

const ORGANIZATION_ID_SUFFIX = "#organization";
const WEBSITE_ID_SUFFIX = "#website";

export function organizationId(baseUrl: string = siteConfig.url): string {
  return `${baseUrl}${ORGANIZATION_ID_SUFFIX}`;
}

/**
 * `ProfessionalService` (a subtype of `Organization`) rather than plain
 * `Organization` — SIGMA+ sells professional/consulting-style software
 * services, which is what this type is for. `sameAs` and `logo` are
 * intentionally omitted: no real, configured social profiles or a
 * production logo asset exist yet (see docs/SEO_STRATEGY.md "known
 * limitations") — adding fabricated ones would violate the project's
 * anti-fabrication rule more than omitting them costs in schema
 * completeness.
 */
export function buildOrganizationSchema(config: EffectiveSiteConfig) {
  return {
    "@type": "ProfessionalService",
    "@id": organizationId(config.url),
    name: config.legalName,
    url: config.url,
    email: config.contactEmail,
    telephone: config.contactPhone,
    // Real, launched-for markets per the brief (Algeria-first, then France/Germany/UAE) — not a claim of physical offices.
    areaServed: ["DZ", "FR", "DE", "AE"],
    availableLanguage: ["fr", "ar", "en", "de"],
  };
}

export function buildWebSiteSchema(config: EffectiveSiteConfig) {
  return {
    "@type": "WebSite",
    "@id": `${config.url}${WEBSITE_ID_SUFFIX}`,
    name: config.name,
    url: config.url,
    publisher: { "@id": organizationId(config.url) },
    inLanguage: ["fr", "ar", "en", "de"],
  };
}

export function buildServiceSchema(params: { name: string; description: string; url: string }) {
  return {
    "@type": "Service",
    name: params.name,
    description: params.description,
    url: params.url,
    provider: { "@id": organizationId() },
    areaServed: ["DZ", "FR", "DE", "AE"],
  };
}

/**
 * `CreativeWork`, not `SoftwareApplication` — a case-study *page* is an
 * editorial write-up about a delivered project, not the software
 * itself, and SIGMA+ doesn't distribute these products for the
 * visitor to install/run. Marking the page as a SoftwareApplication
 * would misrepresent what the URL actually is (schema abuse the brief
 * explicitly warns against).
 */
export function buildCaseStudySchema(params: { name: string; description: string; url: string }) {
  return {
    "@type": "CreativeWork",
    name: params.name,
    description: params.description,
    url: params.url,
    creator: { "@id": organizationId() },
  };
}

export function buildFaqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function buildBreadcrumbListSchema(items: { name: string; url?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

/** Wraps one or more schema nodes with `@context` — pass an array to emit a `@graph` (preferred whenever a page has more than one entity, so they share one script tag and can reference each other by `@id`). */
export function withSchemaContext(nodes: object | object[]) {
  if (Array.isArray(nodes)) {
    return { "@context": "https://schema.org", "@graph": nodes };
  }
  return { "@context": "https://schema.org", ...nodes };
}
