/**
 * Phase 12 — SEO job orchestration domain model. A "job" here is one
 * scheduled/triggerable unit of work (audit, sync, analysis, report)
 * — always provider-neutral: nothing in this file or its consumers
 * hardwires a specific vendor. See src/lib/seo/jobs/ for the actual
 * job implementations and docs/SEO_STRATEGY.md §28 for the full
 * architecture writeup.
 */

export const SEO_JOB_TYPES = [
  "DAILY_TECHNICAL_AUDIT",
  "DAILY_SEARCH_CONSOLE_SYNC",
  "DAILY_ANALYTICS_SYNC",
  "WEEKLY_PAGESPEED_AUDIT",
  "WEEKLY_KEYWORD_ANALYSIS",
  "WEEKLY_SEO_OPPORTUNITY_ANALYSIS",
  "WEEKLY_CONTENT_DECAY_ANALYSIS",
  /**
   * Not in the original 7 job types the spec enumerated for the
   * orchestration layer itself, but explicitly required as its own
   * schedulable unit by the weekly-executive-report and
   * production-scheduling-plan sections — added here as an 8th type
   * rather than folding report generation into another job, since it
   * has a distinct weekly cadence and its own persisted output.
   */
  "WEEKLY_EXECUTIVE_REPORT",
] as const;
export type SeoJobType = (typeof SEO_JOB_TYPES)[number];

/** The exact allowlist check the cron endpoint uses to validate `?job=` — extracted here (rather than left as a local function in the route file, which can't be unit-tested outside the Next.js runtime) so "invalid job type" is directly testable. */
export function isValidSeoJobType(value: string | null | undefined): value is SeoJobType {
  return typeof value === "string" && (SEO_JOB_TYPES as readonly string[]).includes(value);
}

/**
 * A closed set, enforced twice: this TS union (the app can never write
 * anything else) and a Postgres CHECK constraint on the column itself
 * (schema.ts) as defense-in-depth. `TIMED_OUT` is distinct from
 * `FAILED` — it means "no result was ever recorded, the row was
 * reclaimed as abandoned after exceeding the staleness window," not
 * "the job ran and errored." No `SKIPPED` status: a rejected dispatch
 * attempt (already running) never gets a row at all, so there's
 * nothing for it to describe.
 */
export const SEO_JOB_STATUSES = ["RUNNING", "SUCCEEDED", "FAILED", "PARTIAL", "TIMED_OUT"] as const;
export type SeoJobStatus = (typeof SEO_JOB_STATUSES)[number];

export const SEO_JOB_TRIGGERS = ["CRON", "MANUAL"] as const;
export type SeoJobTrigger = (typeof SEO_JOB_TRIGGERS)[number];

/**
 * Every count a job reports is a plain integer — never a raw row, a
 * URL parameter value, or anything that could carry PII. `skipped`
 * specifically covers "would have created a duplicate recommendation,
 * left the existing one alone instead" (see the dedup fix in
 * seo-recommendation-service.ts).
 */
export type SeoJobCounts = {
  issuesFound?: number;
  recommendationsCreated?: number;
  recommendationsSkippedDuplicate?: number;
  pagesChecked?: number;
  opportunitiesFound?: number;
  [key: string]: number | undefined;
};

/**
 * A snapshot of every provider's connection status at the moment this
 * job ran — lets a job's history explain "this sync did nothing
 * because GSC wasn't configured yet" without needing to cross-
 * reference `seo_connections` separately later (that table only ever
 * holds the *current* state, not history).
 */
export type SeoSourceFreshness = Record<string, "CONNECTED" | "NOT_CONFIGURED" | "ERROR" | "EXPIRED">;

export type SeoJobRun = {
  id: string;
  jobType: SeoJobType;
  runId: string;
  status: SeoJobStatus;
  triggeredBy: SeoJobTrigger;
  startedAt: Date;
  completedAt?: Date;
  counts?: SeoJobCounts;
  /** A safe, non-secret classifier/summary only — never a raw stack trace or a message that could embed a connection string/credential (see run-job.ts's error redaction). */
  errorSummary?: string;
  sourceFreshness?: SeoSourceFreshness;
  /** Only ever populated for WEEKLY_EXECUTIVE_REPORT — see weekly-report.ts's WeeklySeoReport shape. */
  reportSnapshot?: unknown;
};
