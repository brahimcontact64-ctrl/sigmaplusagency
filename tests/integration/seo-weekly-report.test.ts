import { describe, it, expect, beforeAll, vi } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestAnalyticsRepository } from "@/lib/repositories/analytics-repository";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail } from "@/lib/services/identity";

let db: AppDatabase;

vi.mock("@/lib/services/growth-analytics-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/growth-analytics-service")>("@/lib/services/growth-analytics-service");
  const { createTestAnalyticsRepository: makeAnalyticsRepo } = await vi.importActual<typeof import("@/lib/repositories/analytics-repository")>(
    "@/lib/repositories/analytics-repository",
  );
  const { createTestCrmRepository: makeCrmRepo } = await vi.importActual<typeof import("@/lib/repositories/crm-repository")>(
    "@/lib/repositories/crm-repository",
  );
  return {
    ...actual,
    getGrowthAnalyticsService: () => actual.createTestGrowthAnalyticsService(makeAnalyticsRepo(async () => db), makeCrmRepo(async () => db)),
  };
});
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

  const analytics = createTestAnalyticsRepository(async () => db);
  const leadRepo = createTestLeadRepository(async () => db);

  await analytics.record({ eventName: "project_builder_started", anonymousSessionId: "seo-s1", environment: "production", safeProperties: {} });
  await analytics.record({ eventName: "project_builder_completed", anonymousSessionId: "seo-s1", environment: "production", safeProperties: {} });
  await analytics.record({ eventName: "proposal_requested", anonymousSessionId: "seo-s1", environment: "production", safeProperties: {} });
  await analytics.record({ eventName: "lead_created", anonymousSessionId: "seo-s1", environment: "production", safeProperties: { source: "project_builder" } });

  // A lead whose first-touch referrer is a search engine — classifies as organic_search.
  const email = `seo-report-${Math.random().toString(36).slice(2)}@example.com`;
  await leadRepo.createLead({
    publicReference: generatePublicReference(),
    name: "Organic Lead",
    email,
    emailNormalized: normalizeEmail(email),
    language: "fr",
    source: "project_builder",
    referrer: "https://www.google.com/search?q=agence+web+algerie",
  });
});

describe("buildWeeklySeoReport — Phase 12 §12, real data only", () => {
  it("computes real metrics from first-party analytics, including an organic-search lead count", async () => {
    const { buildWeeklySeoReport } = await import("@/lib/seo/services/weekly-report");
    const report = await buildWeeklySeoReport();

    const organicMetric = report.metrics.find((m) => m.label === "Organic-search leads");
    expect(organicMetric).toBeDefined();
    expect(organicMetric!.current).toBeGreaterThanOrEqual(1);

    const leadsMetric = report.metrics.find((m) => m.label === "Leads created");
    expect(leadsMetric!.current).toBeGreaterThanOrEqual(1);

    // Connections is whatever's actually in seo_connections — empty is
    // valid and honest here (no adapter's get*Connection() has run in
    // this isolated test DB), never padded with a fabricated row.
    expect(Array.isArray(report.connections)).toBe(true);
    expect(report.recommendationsAwaitingApproval).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.recentJobRuns)).toBe(true);
  });

  it("never fabricates an AI summary when no AI provider is supplied (the WEEKLY_EXECUTIVE_REPORT job only passes one when AI is actually configured)", async () => {
    const { buildWeeklySeoReport } = await import("@/lib/seo/services/weekly-report");
    const report = await buildWeeklySeoReport(new Date(), null);
    expect(report.aiSummary).toBeUndefined();
  });

  it("passes only already-computed metrics to a supplied AI provider — never a raw email, and never lets it fail the report", async () => {
    const { buildWeeklySeoReport } = await import("@/lib/seo/services/weekly-report");
    const fakeProvider = {
      streamReply: async function* () {},
      complete: async ({ messages }: { messages: { content: string }[] }) => {
        expect(messages[0]!.content).not.toContain("@example.com");
        return "A plain-language summary.";
      },
    };
    const report = await buildWeeklySeoReport(new Date(), fakeProvider);
    expect(report.aiSummary).toBe("A plain-language summary.");
  });

  it("a failing AI provider never breaks report generation — aiSummary is simply omitted", async () => {
    const { buildWeeklySeoReport } = await import("@/lib/seo/services/weekly-report");
    const throwingProvider = {
      streamReply: async function* () {},
      complete: async () => {
        throw new Error("simulated provider failure");
      },
    };
    const report = await buildWeeklySeoReport(new Date(), throwingProvider);
    expect(report.aiSummary).toBeUndefined();
    expect(report.metrics.length).toBeGreaterThan(0);
  });

  it("period and previousPeriod are equal-length, non-overlapping ranges", async () => {
    const { buildWeeklySeoReport } = await import("@/lib/seo/services/weekly-report");
    const report = await buildWeeklySeoReport();

    const periodMs = new Date(report.period.end).getTime() - new Date(report.period.start).getTime();
    const previousMs = new Date(report.previousPeriod.end).getTime() - new Date(report.previousPeriod.start).getTime();
    expect(periodMs).toBe(previousMs);
    expect(new Date(report.previousPeriod.end).getTime()).toBe(new Date(report.period.start).getTime());
  });
});
