import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { seoJobRuns } from "@/lib/db/schema";
import type { SeoJobRun, SeoJobType, SeoJobStatus, SeoJobTrigger, SeoJobCounts, SeoSourceFreshness } from "@/domain/seo-job";

/**
 * Postgres's unique_violation SQLSTATE — the exact code the partial
 * unique index (`seo_job_runs_one_running_per_type_idx`, schema.ts)
 * raises when a second INSERT tries to create a RUNNING row for a
 * job_type that already has one. This is the real lock: `acquire()`
 * below relies on the database rejecting the *losing* insert, not on
 * an application-level check beforehand (which cannot be atomic across
 * concurrent instances — see docs/SEO_STRATEGY.md §28's locking review).
 */
const POSTGRES_UNIQUE_VIOLATION = "23505";

/** Drizzle's postgres-js driver wraps every real driver error as `DrizzleQueryError`, whose own `.message` never includes the underlying Postgres error code — the real `PostgresError` (with `.code`) is on `.cause`. See scripts/migrate-prod.ts's `describeError` for the same unwrapping, done there for logging rather than a control-flow decision. */
function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string } } | undefined)?.cause;
  const code = cause?.code ?? (error as { code?: string } | undefined)?.code;
  return code === POSTGRES_UNIQUE_VIOLATION;
}

function toRun(row: typeof seoJobRuns.$inferSelect): SeoJobRun {
  return {
    id: row.id,
    jobType: row.jobType as SeoJobType,
    runId: row.runId,
    status: row.status as SeoJobStatus,
    triggeredBy: row.triggeredBy as SeoJobTrigger,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? undefined,
    counts: (row.counts as SeoJobCounts | null) ?? undefined,
    errorSummary: row.errorSummary ?? undefined,
    sourceFreshness: (row.sourceFreshness as SeoSourceFreshness | null) ?? undefined,
    reportSnapshot: row.reportSnapshot ?? undefined,
  };
}

export type NewSeoJobRunInput = {
  jobType: SeoJobType;
  runId: string;
  triggeredBy: SeoJobTrigger;
};

export type AcquireResult = { acquired: true; run: SeoJobRun } | { acquired: false; runningSince: Date };

export interface SeoJobRepository {
  /**
   * The real, atomic lock acquisition (pre-commit review fix). Two
   * steps, in order:
   *
   *   1. Best-effort reclaim: any RUNNING row for this job_type whose
   *      `started_at` is older than `staleAfterMinutes` (compared using
   *      Postgres's own `now()`, never the calling process's clock) is
   *      conditionally UPDATEd to TIMED_OUT. This is race-safe on its
   *      own even with no lock yet: if two workers run this at once,
   *      Postgres's normal row-level locking on UPDATE means at most
   *      one of them actually flips the row (the second's `WHERE
   *      status = 'RUNNING'` no longer matches once the first commits)
   *      — the exact row count changed is never relied on for anything
   *      beyond "did I personally reclaim a row," which nothing here
   *      actually needs.
   *   2. Insert a new RUNNING row. The partial unique index on
   *      (job_type) WHERE status='RUNNING' is the actual gate: if a
   *      RUNNING row for this job_type still exists (a real active run,
   *      or a stale one step 1 didn't reclaim because a DIFFERENT
   *      worker already had), Postgres itself rejects this insert with
   *      a unique_violation — caught here and reported as
   *      `{acquired: false}`, never thrown further.
   *
   * No transaction spans both steps and the caller's subsequent job
   * execution — each is its own short-lived, auto-committed statement,
   * so no connection/transaction is held open for the duration of an
   * external API call (see docs/SEO_STRATEGY.md §28).
   */
  acquire(input: NewSeoJobRunInput, staleAfterMinutes: number): Promise<AcquireResult>;
  complete(
    id: string,
    patch: { status: Extract<SeoJobStatus, "SUCCEEDED" | "FAILED" | "PARTIAL">; counts?: SeoJobCounts; errorSummary?: string; sourceFreshness?: SeoSourceFreshness; reportSnapshot?: unknown },
  ): Promise<SeoJobRun | null>;
  /** Read-only/informational only — never the enforcement mechanism (see `acquire`). Whatever RUNNING row currently exists for this job type, regardless of staleness; callers that need the real lock decision must use `acquire`. */
  findActiveRun(jobType: SeoJobType): Promise<SeoJobRun | null>;
  history(jobType?: SeoJobType, limit?: number): Promise<SeoJobRun[]>;
  lastSuccessful(jobType: SeoJobType): Promise<SeoJobRun | null>;
}

export class DrizzleSeoJobRepository implements SeoJobRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async acquire(input: NewSeoJobRunInput, staleAfterMinutes: number): Promise<AcquireResult> {
    const db = await this.getDbInstance();

    // Step 1 — best-effort stale reclaim. `now()` is evaluated inside
    // Postgres itself (make_interval is a real Postgres builtin taking
    // a plain numeric parameter, never string-concatenated), so this
    // never depends on the calling process's clock. Race-safe on its
    // own per this method's doc comment; its result is intentionally
    // unused here — step 2 is the actual gate regardless of whether
    // this worker was the one that reclaimed anything.
    await db
      .update(seoJobRuns)
      .set({ status: "TIMED_OUT", completedAt: new Date(), errorSummary: `Reclaimed: exceeded the ${staleAfterMinutes}-minute staleness window without completing.` })
      .where(
        and(
          eq(seoJobRuns.jobType, input.jobType),
          eq(seoJobRuns.status, "RUNNING"),
          lt(seoJobRuns.startedAt, sql`now() - make_interval(mins => ${staleAfterMinutes})`),
        ),
      );

    // Step 2 — the real atomic gate. A losing insert is expected,
    // routine control flow, not a system error — caught, never rethrown
    // for that one specific cause.
    try {
      const [row] = await db.insert(seoJobRuns).values({ ...input, status: "RUNNING" }).returning();
      return { acquired: true, run: toRun(row) };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const active = await this.findActiveRun(input.jobType);
      return { acquired: false, runningSince: active?.startedAt ?? new Date() };
    }
  }

  async complete(id: string, patch: Parameters<SeoJobRepository["complete"]>[1]): Promise<SeoJobRun | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .update(seoJobRuns)
      .set({
        status: patch.status,
        completedAt: new Date(),
        // `SeoJobCounts`'s optional keys are individually `number |
        // undefined`, but Drizzle's jsonb column type wants a plain
        // `Record<string, number>` — an actual `undefined` value would
        // never be persisted as a JSON key anyway (JSON.stringify
        // drops it), so this cast doesn't change runtime behavior.
        counts: patch.counts as Record<string, number> | undefined,
        errorSummary: patch.errorSummary,
        sourceFreshness: patch.sourceFreshness as Record<string, string> | undefined,
        reportSnapshot: patch.reportSnapshot,
      })
      .where(eq(seoJobRuns.id, id))
      .returning();
    return row ? toRun(row) : null;
  }

  async findActiveRun(jobType: SeoJobType): Promise<SeoJobRun | null> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(seoJobRuns)
      .where(and(eq(seoJobRuns.jobType, jobType), eq(seoJobRuns.status, "RUNNING")))
      .orderBy(desc(seoJobRuns.startedAt))
      .limit(1);
    return rows[0] ? toRun(rows[0]) : null;
  }

  async history(jobType?: SeoJobType, limit = 20): Promise<SeoJobRun[]> {
    const db = await this.getDbInstance();
    const where = jobType ? eq(seoJobRuns.jobType, jobType) : undefined;
    const rows = await db.select().from(seoJobRuns).where(where).orderBy(desc(seoJobRuns.startedAt)).limit(limit);
    return rows.map(toRun);
  }

  async lastSuccessful(jobType: SeoJobType): Promise<SeoJobRun | null> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(seoJobRuns)
      .where(and(eq(seoJobRuns.jobType, jobType), eq(seoJobRuns.status, "SUCCEEDED")))
      .orderBy(desc(seoJobRuns.startedAt))
      .limit(1);
    return rows[0] ? toRun(rows[0]) : null;
  }
}

let repository: SeoJobRepository | null = null;

export function getSeoJobRepository(): SeoJobRepository {
  if (!repository) repository = new DrizzleSeoJobRepository();
  return repository;
}

export function createTestSeoJobRepository(getDbInstance: typeof getDb): SeoJobRepository {
  return new DrizzleSeoJobRepository(getDbInstance);
}
