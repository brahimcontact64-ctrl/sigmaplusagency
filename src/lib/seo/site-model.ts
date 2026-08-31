import fs from "node:fs";
import path from "node:path";
import { routing, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { getAllServiceIds, getServiceContent, getServiceMeta, getServiceSlug } from "@/content/services";
import { getAllProjectIds, getCaseStudyContent, getCaseStudyMeta, getProjectSlug } from "@/content/case-studies";
import type { ServiceId } from "@/domain/service";
import type { ProjectId } from "@/domain/case-study";

/**
 * A deterministic model of every known public page, in every locale —
 * the one input the audit engine (audit.ts) analyzes. Deliberately does
 * NOT render React or call next-intl's `getTranslations` (which only
 * resolves inside Next's own bundler, per the standing `server-only`/
 * `next-intl` gotcha) — it reads `messages/*.json` directly and reuses
 * the same plain content-layer functions the real pages call, so the
 * modeled title/description mirror what generateMetadata actually
 * produces without needing a running Next server. This lets both
 * `npm run seo:audit` (a plain script) and the Admin SEO page (a real
 * Next server component) share one implementation.
 */

export type PageModel = {
  /** Stable, human-readable key independent of locale — e.g. "service:web-development". */
  routeKey: string;
  locale: Locale;
  /** Locale-prefixed path, e.g. "/fr/services/developpement-web". */
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  h1: string;
};

const messagesCache = new Map<Locale, Record<string, unknown>>();

function loadMessages(locale: Locale): Record<string, unknown> {
  const cached = messagesCache.get(locale);
  if (cached) return cached;
  const file = path.join(process.cwd(), "messages", `${locale}.json`);
  const parsed = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, unknown>;
  messagesCache.set(locale, parsed);
  return parsed;
}

/** Dotted-path lookup into a locale's messages, e.g. "servicesPage.title". */
function readMessage(locale: Locale, keyPath: string): string {
  const segments = keyPath.split(".");
  let node: unknown = loadMessages(locale);
  for (const segment of segments) {
    if (typeof node !== "object" || node === null) return "";
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" ? node : "";
}

const BRAND_SUFFIX = ` — ${siteConfig.name}`;

function fixedPage(routeKey: string, urlPath: string, titleKey: string, descriptionKey: string, opts?: { suffixed?: boolean }): (locale: Locale) => PageModel {
  return (locale) => {
    const rawTitle = readMessage(locale, titleKey);
    return {
      routeKey,
      locale,
      path: `/${locale}${urlPath}`,
      title: opts?.suffixed === false ? rawTitle : `${rawTitle}${BRAND_SUFFIX}`,
      description: readMessage(locale, descriptionKey),
      indexable: true,
      h1: rawTitle,
    };
  };
}

const FIXED_PAGES = [
  fixedPage("services-index", "/services", "servicesPage.title", "servicesPage.subtitle"),
  fixedPage("work-index", "/work", "workPage.title", "workPage.subtitle"),
  fixedPage("about", "/about", "about.title", "about.intro"),
  fixedPage("contact", "/contact", "contactPage.title", "contactPage.subtitle"),
  fixedPage("start-project", "/start-project", "projectBuilder.meta.title", "projectBuilder.meta.description", { suffixed: false }),
  fixedPage("ai-consultant", "/ai-consultant", "aiConsultant.meta.title", "aiConsultant.meta.description", { suffixed: false }),
];

function buildHomeModel(locale: Locale): PageModel {
  return {
    routeKey: "home",
    locale,
    path: `/${locale}`,
    title: readMessage(locale, "meta.title"),
    description: readMessage(locale, "meta.description"),
    indexable: true,
    h1: readMessage(locale, "hero.headlineLine1"),
  };
}

function buildServiceModel(locale: Locale, id: ServiceId): PageModel {
  const content = getServiceContent(locale, id);
  return {
    routeKey: `service:${id}`,
    locale,
    path: `/${locale}/services/${getServiceSlug(locale, id)}`,
    title: `${content.title}${BRAND_SUFFIX}`,
    description: content.positioning,
    indexable: true,
    h1: content.title,
  };
}

function buildCaseStudyModel(locale: Locale, id: ProjectId): PageModel {
  const content = getCaseStudyContent(locale, id);
  return {
    routeKey: `case-study:${id}`,
    locale,
    path: `/${locale}/work/${getProjectSlug(locale, id)}`,
    title: `${content.name}${BRAND_SUFFIX}`,
    description: content.summary,
    indexable: true,
    h1: content.name,
  };
}

export function buildSiteModel(): PageModel[] {
  const pages: PageModel[] = [];

  for (const locale of routing.locales) {
    pages.push(buildHomeModel(locale));
    for (const build of FIXED_PAGES) pages.push(build(locale));
    for (const id of getAllServiceIds()) pages.push(buildServiceModel(locale, id));
    for (const id of getAllProjectIds()) pages.push(buildCaseStudyModel(locale, id));
  }

  return pages;
}

export { getServiceMeta, getCaseStudyMeta, getAllServiceIds, getAllProjectIds };
