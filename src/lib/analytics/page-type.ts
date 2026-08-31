/**
 * Pure, dependency-free classifier from a pathname to a short
 * `pageType` dimension — kept separate from any client/React code so
 * it's directly Vitest-testable (same "pure module" pattern as
 * rbac.ts / site-config-merge.ts). Never throws; unknown shapes fall
 * back to the first path segment rather than "unknown" so a genuinely
 * new route still shows up as *something* legible in the dashboard.
 */
export function classifyPageType(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // First segment is the locale (this classifier is only ever called
  // from within the [locale] route tree) — drop it.
  const [, first, second] = segments;

  if (!first) return "home";
  if (first === "services") return second ? "service_detail" : "services_index";
  if (first === "work") return second ? "case_study_detail" : "work_index";
  if (first === "insights") return second ? "article_detail" : "insights_index";
  if (first === "start-project") return "project_builder";
  if (first === "ai-consultant") return "ai_consultant";
  if (first === "contact") return "contact";
  if (first === "about") return "about";
  return first.slice(0, 60);
}
