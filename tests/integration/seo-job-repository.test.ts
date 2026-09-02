import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestSeoJobRepository, type SeoJobRepository } from "@/lib/repositories/seo-job-repository";

let db: AppDatabase;
let repo: SeoJobRepository;

beforeAll(async () => {
  db = await createTestDb();
  repo = createTestSeoJobRepository(async () => db);
});

describe("SeoJobRepository — Phase 12 job history/locking", () => {
  it("acquire() creates a RUNNING row; complete() finalizes it with counts", async () => {
    const result = await repo.acquire({ jobType: "DAILY_TECHNICAL_AUDIT", runId: "run-1", triggeredBy: "MANUAL" }, 30);
    expect(result.acquired).toBe(true);
    if (!result.acquired) return;
    expect(result.run.status).toBe("RUNNING");
    expect(result.run.completedAt).toBeUndefined();

    const completed = await repo.complete(result.run.id, { status: "SUCCEEDED", counts: { issuesFound: 3 } });
    expect(completed?.status).toBe("SUCCEEDED");
    expect(completed?.completedAt).toBeInstanceOf(Date);
    expect(completed?.counts).toEqual({ issuesFound: 3 });
  });

  it("a second acquire() for the same job type is rejected while the first is still RUNNING", async () => {
    const first = await repo.acquire({ jobType: "DAILY_SEARCH_CONSOLE_SYNC", runId: "run-2a", triggeredBy: "CRON" }, 30);
    expect(first.acquired).toBe(true);

    const second = await repo.acquire({ jobType: "DAILY_SEARCH_CONSOLE_SYNC", runId: "run-2b", triggeredBy: "MANUAL" }, 30);
    expect(second.acquired).toBe(false);
    if (second.acquired) return;
    expect(second.runningSince).toBeInstanceOf(Date);
  });

  it("PROOF OF ATOMICITY: N truly concurrent acquire() calls for the same job type — exactly one wins, regardless of interleaving", async () => {
    const jobType = "DAILY_ANALYTICS_SYNC" as const;
    const attempts = 10;

    // Fired via Promise.all (not sequential awaits) so these are genuinely
    // concurrent requests to the same underlying database, not merely
    // concurrent in this test's own event-loop scheduling — this is what
    // actually exercises the partial unique index rather than just the
    // application code's happy-path ordering.
    const results = await Promise.all(
      Array.from({ length: attempts }, (_, i) => repo.acquire({ jobType, runId: `race-${i}`, triggeredBy: "CRON" }, 30)),
    );

    const acquired = results.filter((r) => r.acquired);
    const rejected = results.filter((r) => !r.acquired);
    expect(acquired).toHaveLength(1);
    expect(rejected).toHaveLength(attempts - 1);

    // And the database itself agrees there is exactly one RUNNING row —
    // not just that the application code returned one "acquired: true".
    const history = await repo.history(jobType, 50);
    const runningRows = history.filter((r) => r.status === "RUNNING");
    expect(runningRows).toHaveLength(1);
  });

  it("different job types acquire independently — one running does not block another", async () => {
    const a = await repo.acquire({ jobType: "WEEKLY_KEYWORD_ANALYSIS", runId: "indep-a", triggeredBy: "CRON" }, 30);
    const b = await repo.acquire({ jobType: "WEEKLY_CONTENT_DECAY_ANALYSIS", runId: "indep-b", triggeredBy: "CRON" }, 30);
    expect(a.acquired).toBe(true);
    expect(b.acquired).toBe(true);
  });

  it("a FAILED completion releases the lock — a fresh acquire() for the same type succeeds immediately after", async () => {
    const jobType = "WEEKLY_PAGESPEED_AUDIT" as const;
    const first = await repo.acquire({ jobType, runId: "release-failed", triggeredBy: "MANUAL" }, 30);
    expect(first.acquired).toBe(true);
    if (!first.acquired) return;
    await repo.complete(first.run.id, { status: "FAILED", errorSummary: "simulated" });

    const second = await repo.acquire({ jobType, runId: "release-failed-2", triggeredBy: "MANUAL" }, 30);
    expect(second.acquired).toBe(true);
  });

  it("a SUCCEEDED completion releases the lock the same way", async () => {
    const jobType = "WEEKLY_SEO_OPPORTUNITY_ANALYSIS" as const;
    const first = await repo.acquire({ jobType, runId: "release-ok", triggeredBy: "MANUAL" }, 30);
    if (!first.acquired) throw new Error("expected first acquire to succeed");
    await repo.complete(first.run.id, { status: "SUCCEEDED" });

    const second = await repo.acquire({ jobType, runId: "release-ok-2", triggeredBy: "MANUAL" }, 30);
    expect(second.acquired).toBe(true);
  });

  it("a RUNNING row older than the staleness window is reclaimed (TIMED_OUT) and a new run can acquire", async () => {
    const jobType = "WEEKLY_EXECUTIVE_REPORT" as const;
    const stale = await repo.acquire({ jobType, runId: "stale-1", triggeredBy: "CRON" }, 30);
    expect(stale.acquired).toBe(true);

    // A staleAfterMinutes of 0 means "older than right now" — even a
    // just-created row already qualifies, proving the boundary logic
    // without needing to wait 30 real minutes.
    const reclaimed = await repo.acquire({ jobType, runId: "stale-2", triggeredBy: "CRON" }, 0);
    expect(reclaimed.acquired).toBe(true);

    const history = await repo.history(jobType, 10);
    const original = history.find((r) => r.runId === "stale-1");
    expect(original?.status).toBe("TIMED_OUT");
  });

  it("PROOF OF ATOMICITY: two workers racing to recover the SAME stale run — only one becomes the new active run", async () => {
    const jobType = "DAILY_TECHNICAL_AUDIT" as const;
    const original = await repo.acquire({ jobType, runId: "stale-race-0", triggeredBy: "CRON" }, 30);
    expect(original.acquired).toBe(true);

    // Both "workers" attempt to reclaim-and-acquire concurrently with a
    // 0-minute staleness threshold (the existing row is immediately
    // eligible for reclaim for both of them).
    const [workerA, workerB] = await Promise.all([
      repo.acquire({ jobType, runId: "stale-race-a", triggeredBy: "CRON" }, 0),
      repo.acquire({ jobType, runId: "stale-race-b", triggeredBy: "MANUAL" }, 0),
    ]);

    const winners = [workerA, workerB].filter((r) => r.acquired);
    expect(winners).toHaveLength(1);

    const history = await repo.history(jobType, 10);
    expect(history.filter((r) => r.status === "RUNNING")).toHaveLength(1);
  });

  it("findActiveRun() is purely informational and reflects the current RUNNING row, if any", async () => {
    const jobType = "WEEKLY_KEYWORD_ANALYSIS" as const;
    for (const run of await repo.history(jobType, 20)) {
      if (run.status === "RUNNING") await repo.complete(run.id, { status: "SUCCEEDED" });
    }
    const acquired = await repo.acquire({ jobType, runId: "informational-check", triggeredBy: "MANUAL" }, 30);
    expect(acquired.acquired).toBe(true);

    const active = await repo.findActiveRun(jobType);
    expect(active?.status).toBe("RUNNING");
    expect(active?.runId).toBe("informational-check");
  });

  it("findActiveRun() returns null once the run is completed", async () => {
    const jobType = "DAILY_SEARCH_CONSOLE_SYNC" as const;
    // Complete every RUNNING row for this type left over from earlier tests.
    for (const run of await repo.history(jobType, 20)) {
      if (run.status === "RUNNING") await repo.complete(run.id, { status: "SUCCEEDED" });
    }
    expect(await repo.findActiveRun(jobType)).toBeNull();
  });

  it("lastSuccessful() only ever returns a SUCCEEDED row, never FAILED/RUNNING/TIMED_OUT", async () => {
    const jobType = "WEEKLY_CONTENT_DECAY_ANALYSIS" as const;
    for (const run of await repo.history(jobType, 20)) {
      if (run.status === "RUNNING") await repo.complete(run.id, { status: "FAILED", errorSummary: "simulated" });
    }
    expect(await repo.lastSuccessful(jobType)).toBeNull();

    const succeeded = await repo.acquire({ jobType, runId: "last-success", triggeredBy: "CRON" }, 30);
    if (!succeeded.acquired) throw new Error("expected acquire to succeed");
    await repo.complete(succeeded.run.id, { status: "SUCCEEDED", counts: { pagesChecked: 9 } });
    const last = await repo.lastSuccessful(jobType);
    expect(last?.id).toBe(succeeded.run.id);
  });

  it("history() returns runs newest-first and respects the limit", async () => {
    const jobType = "WEEKLY_CONTENT_DECAY_ANALYSIS" as const;
    for (let i = 0; i < 3; i++) {
      const run = await repo.acquire({ jobType, runId: `history-${i}`, triggeredBy: "MANUAL" }, 0);
      if (run.acquired) await repo.complete(run.run.id, { status: "SUCCEEDED" });
    }
    const history = await repo.history(jobType, 2);
    expect(history).toHaveLength(2);
    expect(history[0]!.startedAt.getTime()).toBeGreaterThanOrEqual(history[1]!.startedAt.getTime());
  });

  it("persists sourceFreshness and errorSummary, and errorSummary never contains a raw credential-shaped value in this test's own inputs", async () => {
    const acquired = await repo.acquire({ jobType: "DAILY_SEARCH_CONSOLE_SYNC", runId: "run-7", triggeredBy: "CRON" }, 30);
    if (!acquired.acquired) throw new Error("expected acquire to succeed");
    const completed = await repo.complete(acquired.run.id, {
      status: "PARTIAL",
      sourceFreshness: { GOOGLE_SEARCH_CONSOLE: "ERROR" },
      errorSummary: "Search Console: ERROR — credentials configured but the client is not yet implemented.",
    });
    expect(completed?.sourceFreshness).toEqual({ GOOGLE_SEARCH_CONSOLE: "ERROR" });
    expect(completed?.errorSummary).not.toMatch(/postgres:\/\//);
  });
});
