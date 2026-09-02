import { describe, it, expect, beforeAll, vi } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";

// run-job.ts resolves the repository via getSeoJobRepository() (the
// production singleton) rather than accepting one as a parameter — so
// this test points that singleton's underlying db getter at the
// isolated test database instead, the same technique used wherever a
// module-level singleton needs redirecting in tests.
let db: AppDatabase;

vi.mock("@/lib/repositories/seo-job-repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories/seo-job-repository")>("@/lib/repositories/seo-job-repository");
  return {
    ...actual,
    getSeoJobRepository: () => actual.createTestSeoJobRepository(async () => db),
  };
});

beforeAll(async () => {
  db = await createTestDb();
});

describe("runSeoJob — Phase 12 orchestrator", () => {
  it("dispatches successfully and records SUCCEEDED with the returned counts", async () => {
    const { runSeoJob } = await import("@/lib/seo/jobs/run-job");
    const result = await runSeoJob("DAILY_TECHNICAL_AUDIT", "MANUAL", async () => ({ counts: { issuesFound: 5 } }));

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(result.counts).toEqual({ issuesFound: 5 });
  });

  it("a thrown error is caught, recorded as FAILED with a redacted, safe error summary, and never rethrown", async () => {
    const { runSeoJob } = await import("@/lib/seo/jobs/run-job");
    const { getSeoJobRepository } = await import("@/lib/repositories/seo-job-repository");

    const result = await runSeoJob("DAILY_ANALYTICS_SYNC", "CRON", async () => {
      throw new Error("connection failed: postgresql://user:hunter2@db.example.com:5432/prod and Bearer sk-abcdef123456");
    });

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("FAILED");

    const history = await getSeoJobRepository().history("DAILY_ANALYTICS_SYNC", 1);
    const errorSummary = history[0]!.errorSummary!;
    expect(errorSummary).not.toContain("hunter2");
    expect(errorSummary).not.toContain("postgresql://user:hunter2");
    expect(errorSummary).not.toContain("sk-abcdef123456");
    expect(errorSummary).toContain("postgres://[redacted]");
    expect(errorSummary).toContain("Bearer [redacted]");
  });

  it("returns a degraded PARTIAL status (not FAILED) when work() reports a partial outcome, without throwing", async () => {
    const { runSeoJob } = await import("@/lib/seo/jobs/run-job");
    const result = await runSeoJob("WEEKLY_PAGESPEED_AUDIT", "CRON", async () => ({ counts: { pagesChecked: 1 }, partial: "PageSpeed: ERROR — some safe reason" }));

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("PARTIAL");
  });

  it("refuses to start a second run of the same job type while one is already RUNNING (overlap protection)", async () => {
    const { runSeoJob } = await import("@/lib/seo/jobs/run-job");

    let releaseFirst!: () => void;
    const blocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const firstRunPromise = runSeoJob("WEEKLY_KEYWORD_ANALYSIS", "CRON", async () => {
      await blocker;
      return { counts: { pagesChecked: 1 } };
    });

    // Give the first call time to insert its RUNNING row before the second dispatch attempt.
    await new Promise((r) => setTimeout(r, 20));

    const second = await runSeoJob("WEEKLY_KEYWORD_ANALYSIS", "MANUAL", async () => ({ counts: { pagesChecked: 1 } }));
    expect(second.dispatched).toBe(false);
    if (second.dispatched) return;
    expect(second.reason).toBe("already_running");

    releaseFirst();
    const first = await firstRunPromise;
    expect(first.dispatched).toBe(true);
  });

  it("job history persists across runs — never deleted", async () => {
    const { runSeoJob } = await import("@/lib/seo/jobs/run-job");
    const { getSeoJobRepository } = await import("@/lib/repositories/seo-job-repository");

    await runSeoJob("WEEKLY_CONTENT_DECAY_ANALYSIS", "MANUAL", async () => ({ counts: {} }));
    await runSeoJob("WEEKLY_CONTENT_DECAY_ANALYSIS", "MANUAL", async () => ({ counts: {} }));

    const history = await getSeoJobRepository().history("WEEKLY_CONTENT_DECAY_ANALYSIS");
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});
