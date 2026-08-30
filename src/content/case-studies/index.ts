import type { Locale } from "@/i18n/routing";
import type { ProjectId, LocalizedCaseStudyContentMap } from "@/domain/case-study";
import { PROJECT_IDS } from "@/domain/case-study";
import { matchesSlug } from "@/lib/slug";
import { caseStudiesFr } from "./fr";
import { caseStudiesEn } from "./en";
import { caseStudiesAr } from "./ar";
import { caseStudiesDe } from "./de";
import { caseStudiesMeta } from "./meta";

const byLocale: Record<Locale, LocalizedCaseStudyContentMap> = {
  fr: caseStudiesFr,
  en: caseStudiesEn,
  ar: caseStudiesAr,
  de: caseStudiesDe,
};

export function getAllProjectIds(): readonly ProjectId[] {
  return PROJECT_IDS;
}

export function getCaseStudyContent(locale: Locale, id: ProjectId) {
  return byLocale[locale][id];
}

export function getCaseStudyMeta(id: ProjectId) {
  return caseStudiesMeta[id];
}

export function getProjectBySlug(locale: Locale, slug: string): ProjectId | undefined {
  const map = byLocale[locale];
  return PROJECT_IDS.find((id) => matchesSlug(map[id].slug, slug));
}

export function getProjectSlug(locale: Locale, id: ProjectId): string {
  return byLocale[locale][id].slug;
}

export function getFeaturedProjects(): readonly ProjectId[] {
  return PROJECT_IDS.filter((id) => caseStudiesMeta[id].featured);
}

export { caseStudiesMeta };
