import { getSeoJobRepository } from "@/lib/repositories/seo-job-repository";
import { log, newCorrelationId } from "@/lib/observability/logger";
import type { SeoJobType, SeoJobTrigger, SeoJobCounts, SeoSourceFreshness, SeoJobStatus } from "@/domain/seo-job";

/**
 * A RUNNING row older than this is treated as abandoned (the process
 * that started it crashed, or a serverless function was killed
 * mid-run) rather than as a permanent lock — every job in this
 * codebase (an audit pass, a still-not-connected provider sync) is
 * expected to finish well within this window, so a stale lock past it
 * is itself the anomaly, not a sign of real concurrent work. Reclaimed
 * atomically alongside lock acquisition — see the repository's
 * `acquire()`.
 */
const STALE_AFTER_MINUTES = 30;

export type JobResult = {
  counts?: SeoJobCounts;
  sourceFreshness?: SeoSourceFreshness;
  reportSnapshot?: unknown;
  /** Set only when the job finished but in a degraded state (e.g. one provider failed while the rest of the job's work still completed) — never thrown, since a partial result is still real, usable data, not a failure. The string becomes the run's errorSummary. */
  partial?: string;
};

export type JobDispatchResult =
  | { dispatched: true; runId: string; status: SeoJobStatus; counts?: SeoJobCounts }
  | { dispatched: false; reason: "already_running"; runningSince: Date };

/**
 * The one place every SEO job (cron-triggered or manually triggered
 * from /admin/seo) actually runs through — provides, uniformly:
 *
 * - Idempotency/concurrency lock: refuses to start a second run of the
 *   same job type while one is already RUNNING. This is enforced by
 *   the database itself (a partial unique index — see the repository's
 *   `acquire()` and schema.ts), not by this function checking then
 *   inserting — that sequence, on its own, cannot be atomic across
 *   concurrent serverless instances (two could both observe "nothing
 *   running" before either has written anything). `acquire()` is what
 *   actually closes that gap.
 * - A persisted run row (RUNNING → SUCCEEDED/FAILED/PARTIAL) with
 *   counts, safe error summary, and source-freshness snapshot — "job
 *   audit history."
 * - Structured, redacted logging via the existing observability logger
 *   (Phase 9) — never a raw stack trace, connection string, or secret.
 * - One provider failing inside `work()` is `work()`'s own
 *   responsibility to catch and report as `partial` — a thrown error
 *   here means the *whole* job failed, not "one provider was down."
 */
export async function runSeoJob(jobType: SeoJobType, triggeredBy: SeoJobTrigger, work: () => Promise<JobResult>): Promise<JobDispatchResult> {
  const repo = getSeoJobRepository();
  const correlationId = newCorrelationId();

  const acquisition = await repo.acquire({ jobType, runId: correlationId, triggeredBy }, STALE_AFTER_MINUTES);
  if (!acquisition.acquired) {
    log({ level: "INFO", event: "seo_job_skipped_already_running", component: "seo-jobs", correlationId, jobType, runningSince: acquisition.runningSince.toISOString() });
    return { dispatched: false, reason: "already_running", runningSince: acquisition.runningSince };
  }

  const run = acquisition.run;
  log({ level: "INFO", event: "seo_job_started", component: "seo-jobs", correlationId, jobType, triggeredBy });

  try {
    const result = await work();
    const status: SeoJobStatus = result.partial ? "PARTIAL" : "SUCCEEDED";
    await repo.complete(run.id, {
      status,
      counts: result.counts,
      sourceFreshness: result.sourceFreshness,
      reportSnapshot: result.reportSnapshot,
      errorSummary: result.partial,
    });
    log({ level: status === "PARTIAL" ? "WARN" : "INFO", event: "seo_job_completed", component: "seo-jobs", correlationId, jobType, status, counts: result.counts });
    return { dispatched: true, runId: run.runId, status, counts: result.counts };
  } catch (error) {
    const errorSummary = safeErrorSummary(error);
    await repo.complete(run.id, { status: "FAILED", errorSummary });
    log({ level: "ERROR", event: "seo_job_failed", component: "seo-jobs", correlationId, jobType, errorSummary });
    return { dispatched: true, runId: run.runId, status: "FAILED" };
  }
}

/** Defense-in-depth beyond the logger's own key-based redaction — strips anything URL/bearer-token-shaped from the error's own message text, in case a library ever embeds a credential directly in a message rather than a keyed field. */
function safeErrorSummary(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const redacted = raw.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  return redacted.slice(0, 500);
}
