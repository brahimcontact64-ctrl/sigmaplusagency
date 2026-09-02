import { buildSiteModel, buildArticleModel } from "@/lib/seo/site-model";

/**
 * The fixed set of pages Core Web Vitals/PageSpeed jobs track (Phase
 * 12 §6): homepage, every service, start-project, contact, every case
 * study, every published article. Not yet limited to genuinely
 * "top-performing" articles specifically by real traffic — that
 * refinement needs GA4 (or first-party) view counts per article,
 * which this function deliberately doesn't reach for itself (keeping
 * it a pure, dependency-light page-list builder); a caller with
 * traffic data can filter/sort this list further.
 */
export async function getTrackedPagePaths(): Promise<string[]> {
  const staticPages = buildSiteModel();
  const articlePages = await buildArticleModel();

  const tracked = [...staticPages, ...articlePages].filter(
    (p) =>
      p.routeKey === "home" ||
      p.routeKey === "start-project" ||
      p.routeKey === "contact" ||
      p.routeKey.startsWith("service:") ||
      p.routeKey.startsWith("case-study:") ||
      p.routeKey.startsWith("article:"),
  );

  return tracked.map((p) => p.path);
}
