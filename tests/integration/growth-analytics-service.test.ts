import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestAnalyticsRepository } from "@/lib/repositories/analytics-repository";
import { createTestCrmRepository } from "@/lib/repositories/crm-repository";
import { createTestGrowthAnalyticsService, type GrowthAnalyticsService } from "@/lib/services/growth-analytics-service";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail } from "@/lib/services/identity";

let db: AppDatabase;
let service: GrowthAnalyticsService;

const RANGE = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };

beforeAll(async () => {
  db = await createTestDb();
  const analytics = createTestAnalyticsRepository(async () => db);
  const crm = createTestCrmRepository(async () => db);
  service = createTestGrowthAnalyticsService(analytics, crm);

  // Project Builder funnel: 3 viewed, 2 started, 1 completed+lead, 1 abandoned.
  for (const id of ["s1", "s2", "s3"]) {
    await analytics.record({ eventName: "project_builder_viewed", anonymousSessionId: id, environment: "production", safeProperties: {} });
  }
  for (const id of ["s1", "s2"]) {
    await analytics.record({ eventName: "project_builder_started", anonymousSessionId: id, environment: "production", safeProperties: {} });
  }
  await analytics.record({ eventName: "project_builder_completed", anonymousSessionId: "s1", environment: "production", safeProperties: {} });
  await analytics.record({ eventName: "lead_created", anonymousSessionId: "s1", environment: "production", safeProperties: { source: "project_builder" } });
  await analytics.record({ eventName: "project_builder_abandoned", anonymousSessionId: "s2", environment: "production", safeProperties: { builderStep: "budget" } });

  // AI-assisted comparison: s4 uses AI and converts; s5 uses AI but doesn't; s6 converts without AI.
  await analytics.record({ eventName: "ai_consultation_started", anonymousSessionId: "s4", environment: "production", safeProperties: {} });
  await analytics.record({ eventName: "lead_created", anonymousSessionId: "s4", environment: "production", safeProperties: { source: "ai_consultant" } });
  await analytics.record({ eventName: "ai_consultation_started", anonymousSessionId: "s5", environment: "production", safeProperties: {} });
  await analytics.record({ eventName: "lead_created", anonymousSessionId: "s6", environment: "production", safeProperties: { source: "contact_form" } });

  // Content breakdown: two views of the same service, one with a lead attached.
  await analytics.record({ eventName: "service_viewed", anonymousSessionId: "s7", environment: "production", safeProperties: { serviceId: "web-development" } });
  await analytics.record({ eventName: "service_viewed", anonymousSessionId: "s8", environment: "production", safeProperties: { serviceId: "web-development" } });
  await analytics.record({ eventName: "cta_click", anonymousSessionId: "s7", environment: "production", safeProperties: { ctaId: "start_project", serviceId: "web-development" } });

  const leadRepo = createTestLeadRepository(async () => db);
  const email = `growth-${Math.random().toString(36).slice(2)}@example.com`;
  const lead = await leadRepo.createLead({
    publicReference: generatePublicReference(),
    name: "Growth Test",
    email,
    emailNormalized: normalizeEmail(email),
    language: "en",
    source: "project_builder",
  });
  await analytics.attachSessionToLead("s7", lead.id);
});

describe("GrowthAnalyticsService", () => {
  it("computes the Project Builder funnel with real stage-to-stage rates", async () => {
    const funnel = await service.getProjectBuilderFunnel(RANGE);
    const viewed = funnel.find((s) => s.event === "project_builder_viewed")!;
    const started = funnel.find((s) => s.event === "project_builder_started")!;
    const completed = funnel.find((s) => s.event === "project_builder_completed")!;
    const abandoned = funnel.find((s) => s.event === "project_builder_abandoned")!;

    expect(viewed.sessionCount).toBe(3);
    expect(started.sessionCount).toBe(2);
    expect(started.conversionFromPrevious).toBeCloseTo(2 / 3);
    expect(completed.sessionCount).toBe(1);
    expect(abandoned.sessionCount).toBe(1);
  });

  it("reports AI-assisted vs. other sessions as correlation, with an honest denominator", async () => {
    const comparison = await service.getAiAssistedComparison(RANGE);
    expect(comparison.aiAssistedSessions).toBe(2); // s4, s5
    expect(comparison.aiAssistedConvertedSessions).toBe(1); // only s4
    expect(comparison.aiAssistedRate).toBeCloseTo(0.5);
  });

  it("computes per-service content breakdown with session-attribution leads", async () => {
    const rows = await service.getServiceBreakdown(RANGE);
    const webDev = rows.find((r) => r.id === "web-development")!;
    expect(webDev.views).toBe(2);
    expect(webDev.ctaClicks).toBe(1);
    expect(webDev.attributedLeads).toBe(1); // only s7 was attached to a lead
  });

  it("returns null rates rather than a fabricated number when a window has zero sessions", async () => {
    const emptyRange = { start: new Date("2000-01-01"), end: new Date("2000-01-02") };
    const overview = await service.getOverview(emptyRange);
    expect(overview.sessions).toBe(0);
    expect(overview.conversionRate).toBeNull();
  });
});
