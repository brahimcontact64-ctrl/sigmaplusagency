import type { Locale } from "@/i18n/routing";
import { getAllServiceIds, getServiceContent, getServiceMeta } from "@/content/services";
import { getFeaturedProjects, getCaseStudyContent, getCaseStudyMeta } from "@/content/case-studies";

/**
 * The model's only source of "facts" about SIGMA+ — grounded in the
 * same typed content layer the public site renders (Phase 3), so the
 * AI can never know something the site itself doesn't say. Case
 * studies are filtered to non-draft content and only verified/partial
 * narrative fields, matching the same trust rules the public case
 * study pages already enforce (see domain/case-study.ts CONTENT_STATUS).
 * Pure function of static content — cheap to compute, memoized per
 * locale since it never changes within a process lifetime.
 */
const cache = new Map<Locale, string>();

export function getKnowledgeDigest(locale: Locale): string {
  const cached = cache.get(locale);
  if (cached) return cached;

  const serviceLines = getAllServiceIds().map((id) => {
    const content = getServiceContent(locale, id);
    const meta = getServiceMeta(id);
    return `- ${content.title}: ${content.positioning} (technologies: ${meta.technologies.join(", ")})`;
  });

  const caseStudyLines = getFeaturedProjects()
    .map((id) => {
      const meta = getCaseStudyMeta(id);
      if (meta.contentStatus === "DRAFT") return null;
      const content = getCaseStudyContent(locale, id);
      const facts = [`${content.name} — ${content.tagline}`, content.whatItIs];
      if (meta.contentStatus === "VERIFIED" && content.narrative.qualitativeOutcome) {
        facts.push(content.narrative.qualitativeOutcome);
      }
      return `- ${facts.join(" ")}`;
    })
    .filter((line): line is string => line !== null);

  const digest = [
    "SIGMA+ services offered:",
    ...serviceLines,
    "",
    "SIGMA+ past work (mention only these facts — never invent metrics, results, or clients not listed here):",
    ...caseStudyLines,
  ].join("\n");

  cache.set(locale, digest);
  return digest;
}
