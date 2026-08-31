import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestAnalyticsRepository, type AnalyticsRepository } from "@/lib/repositories/analytics-repository";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail } from "@/lib/services/identity";

let db: AppDatabase;
let repo: AnalyticsRepository;

const ENV = "test";
// `record()` timestamps rows with the real wall-clock time (no
// createdAt override), so the range must bracket "now" rather than an
// arbitrary fixed date.
const RANGE = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(Date.now() + 24 * 60 * 60 * 1000) };

beforeAll(async () => {
  db = await createTestDb();
  repo = createTestAnalyticsRepository(async () => db);
});

describe("AnalyticsRepository", () => {
  it("records an event and counts it by event name", async () => {
    await repo.record({
      eventName: "page_view",
      anonymousSessionId: "session-a",
      environment: ENV,
      safeProperties: { pageType: "home" },
    });

    const counts = await repo.countByEventName(RANGE, ENV);
    const pageViews = counts.find((c) => c.eventName === "page_view");
    expect(pageViews?.count).toBeGreaterThanOrEqual(1);
  });

  it("counts distinct sessions for one event, not raw row count", async () => {
    await repo.record({ eventName: "service_viewed", anonymousSessionId: "session-b", environment: ENV, safeProperties: { serviceId: "web-development" } });
    await repo.record({ eventName: "service_viewed", anonymousSessionId: "session-b", environment: ENV, safeProperties: { serviceId: "web-development" } });
    await repo.record({ eventName: "service_viewed", anonymousSessionId: "session-c", environment: ENV, safeProperties: { serviceId: "web-development" } });

    const count = await repo.countSessionsWithEvent("service_viewed", RANGE, ENV);
    expect(count).toBe(2); // session-b (deduped) + session-c
  });

  it("filters distinct sessions by a safeProperties value", async () => {
    await repo.record({ eventName: "service_viewed", anonymousSessionId: "session-d", environment: ENV, safeProperties: { serviceId: "mobile-applications" } });

    const webDesign = await repo.countSessionsWithEventProperty("service_viewed", "serviceId", "web-development", RANGE, ENV);
    const mobileApps = await repo.countSessionsWithEventProperty("service_viewed", "serviceId", "mobile-applications", RANGE, ENV);
    expect(webDesign).toBe(2);
    expect(mobileApps).toBe(1);
  });

  it("counts sessions that fired ALL of the given events", async () => {
    await repo.record({ eventName: "ai_consultation_started", anonymousSessionId: "session-e", environment: ENV, safeProperties: {} });
    await repo.record({ eventName: "lead_created", anonymousSessionId: "session-e", environment: ENV, safeProperties: { source: "ai_consultant" } });
    await repo.record({ eventName: "ai_consultation_started", anonymousSessionId: "session-f", environment: ENV, safeProperties: {} });

    const both = await repo.countSessionsWithAllEvents(["ai_consultation_started", "lead_created"], RANGE, ENV);
    expect(both).toBe(1); // only session-e has both
  });

  it("groups distinct sessions by a property value, including lead attribution", async () => {
    const leadRepo = createTestLeadRepository(async () => db);
    const email = `attrib-${Math.random().toString(36).slice(2)}@example.com`;
    const lead = await leadRepo.createLead({
      publicReference: generatePublicReference(),
      name: "Attribution Test",
      email,
      emailNormalized: normalizeEmail(email),
      language: "en",
      source: "project_builder",
    });

    await repo.record({ eventName: "case_study_viewed", anonymousSessionId: "session-g", environment: ENV, safeProperties: { caseStudyId: "saheat" } });
    const attached = await repo.attachSessionToLead("session-g", lead.id);
    expect(attached).toBeGreaterThanOrEqual(1);

    const rows = await repo.groupDistinctSessionsByProperty("case_study_viewed", "caseStudyId", RANGE, ENV);
    const saheat = rows.find((r) => r.value === "saheat");
    expect(saheat?.sessionCount).toBeGreaterThanOrEqual(1);
    expect(saheat?.leadAttributedSessionCount).toBeGreaterThanOrEqual(1);
  });

  it("never re-attaches an event that's already linked to a different lead", async () => {
    const leadRepo = createTestLeadRepository(async () => db);
    const email1 = `first-${Math.random().toString(36).slice(2)}@example.com`;
    const lead1 = await leadRepo.createLead({
      publicReference: generatePublicReference(),
      name: "First",
      email: email1,
      emailNormalized: normalizeEmail(email1),
      language: "en",
      source: "contact_form",
    });
    const email2 = `second-${Math.random().toString(36).slice(2)}@example.com`;
    const lead2 = await leadRepo.createLead({
      publicReference: generatePublicReference(),
      name: "Second",
      email: email2,
      emailNormalized: normalizeEmail(email2),
      language: "en",
      source: "contact_form",
    });

    await repo.record({ eventName: "contact_form_submitted", anonymousSessionId: "session-h", environment: ENV, safeProperties: {} });
    await repo.attachSessionToLead("session-h", lead1.id);
    const secondAttachCount = await repo.attachSessionToLead("session-h", lead2.id);
    expect(secondAttachCount).toBe(0); // already attributed to lead1, never rewritten
  });

  it("counts distinct sessions across all events", async () => {
    const total = await repo.countDistinctSessions(RANGE, ENV);
    expect(total).toBeGreaterThan(0);
  });

  it("reports the latest event timestamp", async () => {
    const latest = await repo.latestEventAt();
    expect(latest).toBeInstanceOf(Date);
  });
});
