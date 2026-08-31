import fs from "node:fs";
import path from "node:path";
import { buildSiteModel, buildArticleModel, getServiceMeta, getCaseStudyMeta, getAllServiceIds, getAllProjectIds, type PageModel } from "./site-model";
import { getCaseStudyContent } from "@/content/case-studies";
import { getArticleRepository } from "@/lib/repositories/article-repository";
import { routing } from "@/i18n/routing";
import type { SeoIssue } from "@/domain/seo-issue";
import type { ArticleWithTranslation } from "@/domain/article";

/**
 * Deterministic checks only — no external API, no AI call, no browser.
 * See docs/SEO_STRATEGY.md "SEO audit engine foundation" for the full
 * policy. Every issue is `INTERNAL_AUDIT` provenance and carries a
 * concrete recommendation, never a bare "something's wrong."
 */

const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 65;
const DESCRIPTION_MIN_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 165;

let issueCounter = 0;
function nextId(): string {
  issueCounter += 1;
  return `seo-issue-${issueCounter}`;
}

function issue(partial: Omit<SeoIssue, "id" | "source" | "detectedAt">): SeoIssue {
  return { id: nextId(), source: "INTERNAL_AUDIT", detectedAt: new Date().toISOString(), ...partial };
}

function checkMetadataQuality(pages: PageModel[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const titlesByLocale = new Map<string, Map<string, string[]>>();
  const descriptionsByLocale = new Map<string, Map<string, string[]>>();

  for (const page of pages) {
    if (!page.title) {
      issues.push(issue({ type: "ERROR", page: page.path, locale: page.locale, message: `Missing title for ${page.routeKey}.`, recommendation: "Set a real, differentiated title for this page." }));
    } else if (page.title.length < TITLE_MIN_LENGTH) {
      issues.push(issue({ type: "WARNING", page: page.path, locale: page.locale, message: `Title is very short (${page.title.length} chars): "${page.title}".`, recommendation: `Expand the title toward ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} characters with real, specific copy.` }));
    } else if (page.title.length > TITLE_MAX_LENGTH) {
      issues.push(issue({ type: "OPPORTUNITY", page: page.path, locale: page.locale, message: `Title is long (${page.title.length} chars) and may be truncated in search results: "${page.title}".`, recommendation: `Tighten toward ${TITLE_MAX_LENGTH} characters.` }));
    }

    if (!page.description) {
      issues.push(issue({ type: "ERROR", page: page.path, locale: page.locale, message: `Missing meta description for ${page.routeKey}.`, recommendation: "Add a real, page-specific description." }));
    } else if (page.description.length < DESCRIPTION_MIN_LENGTH) {
      issues.push(issue({ type: "WARNING", page: page.path, locale: page.locale, message: `Meta description is short (${page.description.length} chars) for ${page.routeKey}.`, recommendation: `Expand toward ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters.` }));
    } else if (page.description.length > DESCRIPTION_MAX_LENGTH) {
      issues.push(issue({ type: "OPPORTUNITY", page: page.path, locale: page.locale, message: `Meta description is long (${page.description.length} chars) for ${page.routeKey} and may be truncated.`, recommendation: `Tighten toward ${DESCRIPTION_MAX_LENGTH} characters.` }));
    }

    if (!titlesByLocale.has(page.locale)) titlesByLocale.set(page.locale, new Map());
    if (!descriptionsByLocale.has(page.locale)) descriptionsByLocale.set(page.locale, new Map());
    const titleMap = titlesByLocale.get(page.locale)!;
    const descMap = descriptionsByLocale.get(page.locale)!;
    if (page.title) titleMap.set(page.title, [...(titleMap.get(page.title) ?? []), page.routeKey]);
    if (page.description) descMap.set(page.description, [...(descMap.get(page.description) ?? []), page.routeKey]);
  }

  for (const [locale, titleMap] of titlesByLocale) {
    for (const [title, routeKeys] of titleMap) {
      if (routeKeys.length > 1) {
        issues.push(issue({ type: "ERROR", page: routeKeys.join(", "), locale, message: `Duplicate title "${title}" used by ${routeKeys.length} pages.`, recommendation: "Give each page a unique, differentiated title." }));
      }
    }
  }
  for (const [locale, descMap] of descriptionsByLocale) {
    for (const [description, routeKeys] of descMap) {
      if (routeKeys.length > 1) {
        issues.push(issue({ type: "WARNING", page: routeKeys.join(", "), locale, message: `Duplicate meta description used by ${routeKeys.length} pages: "${description.slice(0, 60)}…".`, recommendation: "Give each page a unique meta description." }));
      }
    }
  }

  return issues;
}

function checkDuplicateCanonicalUrls(pages: PageModel[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const byPath = new Map<string, string[]>();
  for (const page of pages) {
    byPath.set(page.path, [...(byPath.get(page.path) ?? []), page.routeKey]);
  }
  for (const [urlPath, routeKeys] of byPath) {
    if (routeKeys.length > 1) {
      issues.push(issue({ type: "ERROR", page: urlPath, message: `${routeKeys.length} different content entries (${routeKeys.join(", ")}) resolve to the same URL — likely a duplicate/colliding localized slug.`, recommendation: "Give each entry a distinct slug for this locale." }));
    }
  }
  return issues;
}

/** Recursively collects every "leaf" key path (e.g. "servicesPage.title") present in a messages object. Exported for direct unit testing of the diff logic on synthetic objects. */
export function collectKeyPaths(node: unknown, prefix = ""): Set<string> {
  const keys = new Set<string>();
  if (typeof node !== "object" || node === null) {
    if (prefix) keys.add(prefix);
    return keys;
  }
  if (Array.isArray(node)) {
    if (prefix) keys.add(prefix);
    return keys;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    for (const k of collectKeyPaths(value, nextPrefix)) keys.add(k);
  }
  return keys;
}

function checkLocalizationParity(): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const keysByLocale = new Map<string, Set<string>>();

  for (const locale of routing.locales) {
    try {
      const file = path.join(process.cwd(), "messages", `${locale}.json`);
      const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
      keysByLocale.set(locale, collectKeyPaths(parsed));
    } catch (error) {
      issues.push(issue({ type: "ERROR", page: `messages/${locale}.json`, locale, message: `Could not read/parse messages file: ${(error as Error).message}`, recommendation: "Fix the JSON file." }));
    }
  }

  const allKeys = new Set<string>();
  for (const keys of keysByLocale.values()) for (const k of keys) allKeys.add(k);

  for (const key of allKeys) {
    const missingIn = routing.locales.filter((l) => !keysByLocale.get(l)?.has(key));
    if (missingIn.length > 0) {
      issues.push(issue({ type: "WARNING", page: "messages/*.json", message: `Translation key "${key}" is missing in: ${missingIn.join(", ")}.`, recommendation: "Add the missing key(s) so every locale renders the same content." }));
    }
  }

  return issues;
}

/** Every page's own outbound links, expressed as routeKeys — the graph the orphan/reachability check walks. Deliberately mirrors the real internal links each page actually renders (see comments per edge). */
function buildLinkGraph(): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const addEdge = (from: string, to: string) => graph.set(from, [...(graph.get(from) ?? []), to]);

  // Header nav + homepage sections (present on every page, effectively — the header alone already makes every top-level page reachable from anywhere).
  const topLevel = ["services-index", "work-index", "about", "contact", "start-project"];
  for (const target of topLevel) addEdge("home", target);
  // Only ai-consultant isn't in the header nav — but it's linked from the AI entry point wiring (see components/ai-consultant); modeled as reachable from home for graph purposes since the header renders on every page including home.
  addEdge("home", "ai-consultant");

  // Homepage's "what we build" + "work" sections link out to a subset directly.
  for (const id of ["web-development", "mobile-applications", "ecommerce", "saas-platforms", "ai-agents", "seo-growth"]) addEdge("home", `service:${id}`);
  for (const id of getAllProjectIds()) addEdge("home", `case-study:${id}`);

  // Services index links every service.
  for (const id of getAllServiceIds()) addEdge("services-index", `service:${id}`);
  // Work index links every case study.
  for (const id of getAllProjectIds()) addEdge("work-index", `case-study:${id}`);

  // Service detail -> related services + related projects.
  for (const id of getAllServiceIds()) {
    const meta = getServiceMeta(id);
    for (const rel of meta.relatedServices) addEdge(`service:${id}`, `service:${rel}`);
  }
  // Case study -> related services + the "next project" ring (every project links forward, so the ring alone makes every project reachable from any one of them).
  for (const id of getAllProjectIds()) {
    const meta = getCaseStudyMeta(id);
    for (const svc of meta.services) addEdge(`case-study:${id}`, `service:${svc}`);
  }

  return graph;
}

function checkOrphanPages(): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const graph = buildLinkGraph();
  const allRouteKeys = new Set<string>([
    "home",
    "services-index",
    "work-index",
    "about",
    "contact",
    "start-project",
    "ai-consultant",
    ...getAllServiceIds().map((id) => `service:${id}`),
    ...getAllProjectIds().map((id) => `case-study:${id}`),
  ]);

  const visited = new Set<string>();
  const queue = ["home"];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of graph.get(current) ?? []) queue.push(next);
  }

  for (const routeKey of allRouteKeys) {
    if (!visited.has(routeKey)) {
      issues.push(issue({ type: "WARNING", page: routeKey, message: `"${routeKey}" is not reachable from Home via any modeled internal link.`, recommendation: "Add an internal link to this page from a page that's already reachable (nav, homepage section, or a related-content list)." }));
    }
  }

  return issues;
}

function checkEmptyCaseStudies(): SeoIssue[] {
  const issues: SeoIssue[] = [];
  for (const id of getAllProjectIds()) {
    for (const locale of routing.locales) {
      const content = getCaseStudyContent(locale, id);
      const populatedFields = Object.values(content.narrative).filter(Boolean).length;
      if (populatedFields === 0) {
        issues.push(issue({ type: "OPPORTUNITY", page: `/${locale}/work/${content.slug}`, locale, message: `Case study "${content.name}" has no narrative sections (challenge/strategy/implementation/outcome) yet.`, recommendation: "Add real narrative content once available (tracked as NEEDS USER DATA in the master plan) — thin content is a weaker ranking signal." }));
      }
    }
  }
  return issues;
}

/** Best-effort static source scan — only meaningful when the source tree is actually present (true for `npm run seo:audit` in dev/CI; may not be in a deployed serverless bundle, where this silently reports nothing rather than failing). */
function checkHeadingStructure(): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const pagesDir = path.join(process.cwd(), "src", "app", "[locale]");
  if (!fs.existsSync(pagesDir)) return issues;

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "page.tsx") {
        try {
          const content = fs.readFileSync(full, "utf-8");
          const h1Count = (content.match(/<h1[\s>]/g) ?? []).length;
          // PageHero and HeroSection each unconditionally render exactly one
          // <h1> themselves — a page composing one of them (nearly every
          // page in this codebase) correctly has zero literal <h1> in its
          // own source. Only flag a page using neither.
          const usesKnownH1Provider = /<PageHero[\s>]|<HeroSection[\s>]/.test(content);
          const relative = path.relative(process.cwd(), full);
          if (h1Count === 0 && !usesKnownH1Provider) {
            issues.push(issue({ type: "WARNING", page: relative, message: "No <h1> found in this page's own source, and it doesn't use a known H1-providing shared component (PageHero/HeroSection).", recommendation: "Add an <h1>, or compose PageHero/HeroSection." }));
          } else if (h1Count > 1) {
            issues.push(issue({ type: "ERROR", page: relative, message: `${h1Count} <h1> elements found in this page's own source.`, recommendation: "Keep exactly one <h1> per page; demote extras to <h2> or lower." }));
          }
        } catch {
          // Unreadable file — skip rather than fail the whole audit.
        }
      }
    }
  }

  try {
    walk(pagesDir);
  } catch {
    // Source tree not walkable (e.g. a deployed serverless bundle without raw source) — not an error, just nothing to report.
  }
  return issues;
}

function checkBrokenInternalReferences(): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const serviceIds = new Set(getAllServiceIds());
  const projectIds = new Set(getAllProjectIds());

  for (const id of getAllServiceIds()) {
    for (const rel of getServiceMeta(id).relatedServices) {
      if (!serviceIds.has(rel)) {
        issues.push(issue({ type: "ERROR", page: `service:${id}`, message: `relatedServices references unknown service id "${rel}".`, recommendation: "Fix or remove the reference." }));
      }
    }
  }
  for (const id of getAllProjectIds()) {
    for (const svc of getCaseStudyMeta(id).services) {
      if (!serviceIds.has(svc)) {
        issues.push(issue({ type: "ERROR", page: `case-study:${id}`, message: `services references unknown service id "${svc}".`, recommendation: "Fix or remove the reference." }));
      }
    }
  }
  void projectIds; // reserved for a future project-to-project reference check

  return issues;
}

/** Published articles referencing a service/case-study id that no longer exists — same shape as the static-content check above, just DB-sourced. Also the "no accidentally-indexable draft" guarantee: this only ever sees rows `listAllPublishedTranslations()` already filtered to PUBLISHED. */
async function checkArticles(): Promise<SeoIssue[]> {
  const issues: SeoIssue[] = [];
  const serviceIds = new Set(getAllServiceIds());
  const projectIds = new Set(getAllProjectIds());

  let articles: ArticleWithTranslation[];
  try {
    articles = await getArticleRepository().listAllPublishedTranslations();
  } catch (error) {
    issues.push(issue({ type: "WARNING", page: "insights", message: `Could not read published articles from the database: ${(error as Error).message}`, recommendation: "Verify DATABASE_URL / database availability — article-related checks were skipped this run." }));
    return issues;
  }

  const seenSlugs = new Map<string, string>(); // `${locale}::${slug}` -> articleId, to catch a same-locale slug collision the DB's own unique index should already prevent
  for (const article of articles) {
    const key = `${article.translation.locale}::${article.translation.slug}`;
    const existing = seenSlugs.get(key);
    if (existing && existing !== article.id) {
      issues.push(issue({ type: "ERROR", page: `/${article.translation.locale}/insights/${article.translation.slug}`, locale: article.translation.locale, message: `Duplicate published slug "${article.translation.slug}" shared by two different articles.`, recommendation: "Give each article a unique slug per locale." }));
    }
    seenSlugs.set(key, article.id);

    for (const svc of article.relatedServices) {
      if (!serviceIds.has(svc)) {
        issues.push(issue({ type: "ERROR", page: `article:${article.id}`, locale: article.translation.locale, message: `relatedServices references unknown service id "${svc}".`, recommendation: "Fix or remove the reference in the article editor." }));
      }
    }
    for (const proj of article.relatedCaseStudies) {
      if (!projectIds.has(proj)) {
        issues.push(issue({ type: "ERROR", page: `article:${article.id}`, locale: article.translation.locale, message: `relatedCaseStudies references unknown project id "${proj}".`, recommendation: "Fix or remove the reference in the article editor." }));
      }
    }
  }

  return issues;
}

export async function runSeoAudit(): Promise<SeoIssue[]> {
  const staticPages = buildSiteModel();

  let articlePages: PageModel[] = [];
  let articleReferenceIssues: SeoIssue[] = [];
  try {
    articlePages = await buildArticleModel();
    articleReferenceIssues = await checkArticles();
  } catch (error) {
    // Same DB-unavailable resilience as effective-config.ts — a broken
    // article read must never take down the rest of the (static-content)
    // audit, which is still fully meaningful on its own.
    articleReferenceIssues = [
      issue({ type: "WARNING", page: "insights", message: `Could not build the Insights article model: ${(error as Error).message}`, recommendation: "Verify DATABASE_URL / database availability — article-related checks were skipped this run." }),
    ];
  }

  const pages = [...staticPages, ...articlePages];

  return [
    ...checkMetadataQuality(pages),
    ...checkDuplicateCanonicalUrls(pages),
    ...checkLocalizationParity(),
    ...checkOrphanPages(),
    ...checkEmptyCaseStudies(),
    ...checkHeadingStructure(),
    ...checkBrokenInternalReferences(),
    ...articleReferenceIssues,
  ];
}
