/**
 * The deterministic SEO audit engine's finding type — see
 * docs/SEO_STRATEGY.md "SEO audit engine" and "SEO provenance
 * foundation". Every issue this engine produces is `INTERNAL_AUDIT`
 * provenance: derived purely from this codebase's own known route/
 * content model, never from an external API, never AI-generated, never
 * presented as a measured/live fact.
 */
export const SEO_ISSUE_SEVERITIES = ["ERROR", "WARNING", "OPPORTUNITY"] as const;
export type SeoIssueSeverity = (typeof SEO_ISSUE_SEVERITIES)[number];

/**
 * Full provenance vocabulary (Phase 8 §30) — the deterministic audit
 * engine (this file's `SeoIssue`) only ever emits INTERNAL_AUDIT; the
 * others are used by `src/domain/seo-intelligence.ts`'s opportunities
 * and recommendations once a real external connection exists. Never
 * blur an estimate/AI suggestion with an observed external fact by
 * mislabeling its source.
 */
export const SEO_PROVENANCE_LEVELS = [
  "INTERNAL_AUDIT",
  "GOOGLE_SEARCH_CONSOLE",
  "GOOGLE_ANALYTICS",
  "PAGESPEED",
  "MANUAL",
  "ESTIMATE",
  "AI_RECOMMENDATION",
] as const;
export type SeoProvenance = (typeof SEO_PROVENANCE_LEVELS)[number];

/**
 * Workflow statuses are prepared but not persisted this phase — see
 * "SEO issue workflow foundation" in docs/SEO_STRATEGY.md for why a
 * database table isn't justified yet (the audit is cheap enough to
 * just re-run; nothing today needs to remember "someone looked at
 * this already" across runs).
 */
export const SEO_ISSUE_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"] as const;
export type SeoIssueStatus = (typeof SEO_ISSUE_STATUSES)[number];

export type SeoIssue = {
  id: string;
  type: SeoIssueSeverity;
  page: string;
  locale?: string;
  message: string;
  recommendation: string;
  source: SeoProvenance;
  detectedAt: string;
};
