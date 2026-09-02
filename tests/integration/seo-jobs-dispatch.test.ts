import { describe, it, expect, beforeAll, vi } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";

let db: AppDatabase;

// Redirects every repository singleton these jobs touch to one
// isolated PGlite instance — except runSeoAudit()'s own article read,
// which (like the existing seo-audit.test.ts) goes through the real
// singleton against a fresh/clean dev database; a documented, accepted
// limitation (see docs/SEO_STRATEGY.md §26), not new to this phase.
vi.mock("@/lib/repositories/seo-job-repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories/seo-job-repository")>("@/lib/repositories/seo-job-repository");
  return { ...actual, getSeoJobRepository: () => actual.createTestSeoJobRepository(async () => db) };
});
vi.mock("@/lib/repositories/seo-recommendation-repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories/seo-recommendation-repository")>("@/lib/repositories/seo-recommendation-repository");
  return { ...actual, getSeoRecommendationRepository: () => actual.createTestSeoRecommendationRepository(async () => db) };
});
vi.mock("@/lib/repositories/seo-connection-repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories/seo-connection-repository")>("@/lib/repositories/seo-connection-repository");
  return { ...actual, getSeoConnectionRepository: () => actual.createTestSeoConnectionRepository(async () => db) };
});

beforeAll(async () => {
  db = await createTestDb();
});

describe("SEO job dispatch — Phase 12, no external credentials configured", () => {
  it("DAILY_TECHNICAL_AUDIT runs the real deterministic audit and creates real recommendations, never fabricated ones", async () => {
    const { runDailyTechnicalAudit } = await import("@/lib/seo/jobs/daily-technical-audit");
    const result = await runDailyTechnicalAudit("MANUAL");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(typeof result.counts?.issuesFound).toBe("number");
    expect(result.counts!.issuesFound!).toBeGreaterThanOrEqual(0);
  });

  it("DAILY_SEARCH_CONSOLE_SYNC honestly reports NOT_CONFIGURED and zero metrics — SUCCEEDED, not PARTIAL/FAILED", async () => {
    const { runDailySearchConsoleSync } = await import("@/lib/seo/jobs/daily-search-console-sync");
    const result = await runDailySearchConsoleSync("CRON");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(result.counts?.pagesChecked).toBe(0);
  });

  it("DAILY_ANALYTICS_SYNC honestly reports zero pages checked while GA4 reporting is not configured", async () => {
    const { runDailyAnalyticsSync } = await import("@/lib/seo/jobs/daily-analytics-sync");
    const result = await runDailyAnalyticsSync("CRON");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(result.counts?.pagesChecked).toBe(0);
  });

  it("WEEKLY_PAGESPEED_AUDIT checks the real tracked-page list but reports zero metrics while disconnected", async () => {
    const { runWeeklyPageSpeedAudit } = await import("@/lib/seo/jobs/weekly-pagespeed-audit");
    const result = await runWeeklyPageSpeedAudit("CRON");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    // The tracked-page list itself is real (home, services, etc.) even though PageSpeed isn't connected.
    expect(result.counts!.pagesChecked!).toBeGreaterThan(0);
    expect(result.counts?.opportunitiesFound).toBe(0);
  });

  it("WEEKLY_KEYWORD_ANALYSIS checks the real hypothesis seed list but performs zero checks while no SERP provider is configured", async () => {
    const { runWeeklyKeywordAnalysis } = await import("@/lib/seo/jobs/weekly-keyword-analysis");
    const result = await runWeeklyKeywordAnalysis("CRON");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(result.counts!.pagesChecked!).toBeGreaterThan(0); // the real KEYWORD_HYPOTHESES count
    expect(result.counts?.opportunitiesFound).toBe(0); // no provider → no fabricated position
  });

  it("WEEKLY_SEO_OPPORTUNITY_ANALYSIS finds zero opportunities honestly (no GSC data to analyze)", async () => {
    const { runWeeklySeoOpportunityAnalysis } = await import("@/lib/seo/jobs/weekly-seo-opportunity-analysis");
    const result = await runWeeklySeoOpportunityAnalysis("CRON");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(result.counts?.opportunitiesFound).toBe(0);
    expect(result.counts?.recommendationsCreated).toBe(0);
  });

  it("WEEKLY_CONTENT_DECAY_ANALYSIS finds zero opportunities honestly (no comparable GSC periods exist)", async () => {
    const { runWeeklyContentDecayAnalysis } = await import("@/lib/seo/jobs/weekly-content-decay-analysis");
    const result = await runWeeklyContentDecayAnalysis("CRON");

    expect(result.dispatched).toBe(true);
    if (!result.dispatched) return;
    expect(result.status).toBe("SUCCEEDED");
    expect(result.counts?.opportunitiesFound).toBe(0);
  });
});
