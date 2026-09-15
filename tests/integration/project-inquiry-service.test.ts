import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = (key: string) => key;
    return t;
  },
}));

const forwardLeadToMagicFluxMock = vi.fn();
vi.mock("@/lib/integrations/magicflux", () => ({
  forwardLeadToMagicFlux: (...args: unknown[]) => forwardLeadToMagicFluxMock(...args),
}));

import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { submitProjectInquiry } from "@/lib/services/lead-service";
import { leads, projectRequests, leadActivities } from "@/lib/db/schema";

let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(() => {
  forwardLeadToMagicFluxMock.mockReset();
  forwardLeadToMagicFluxMock.mockResolvedValue({ outcome: "SENT", executionId: "exec_1" });
});

function repo() {
  return createTestLeadRepository(async () => db);
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Amine Test",
    email: "amine.inquiry@example.com",
    service: "ecommerce" as const,
    projectDescription: "I need an online store for my clothing brand.",
    budgetRange: "5000-15000",
    budgetCurrency: "EUR" as const,
    desiredStart: "within-1-month" as const,
    urgency: "soon" as const,
    purchaseIntent: "ready-to-discuss" as const,
    locale: "en" as const,
    ...overrides,
  };
}

describe("submitProjectInquiry — the real MagicFlux inquiry form's persistence + forward path", () => {
  it("creates a lead sourced as magicflux_inquiry and a project request", async () => {
    const result = await submitProjectInquiry(validInput(), "nonce-1", repo());
    expect(result.success).toBe(true);
    if (!result.success) return;

    const rows = await db.select().from(leads);
    const created = rows.find((r) => r.id === result.leadId);
    expect(created?.source).toBe("magicflux_inquiry");

    const requests = await db.select().from(projectRequests);
    expect(requests.some((r) => r.leadId === result.leadId)).toBe(true);
  });

  it("records lead_created and project_request_submitted activities", async () => {
    const result = await submitProjectInquiry(validInput({ email: "second.inquiry@example.com" }), "nonce-2", repo());
    expect(result.success).toBe(true);
    if (!result.success) return;

    const activities = (await db.select().from(leadActivities)).filter((a) => a.leadId === result.leadId);
    expect(activities.some((a) => a.type === "lead_created")).toBe(true);
    expect(activities.some((a) => a.type === "project_request_submitted")).toBe(true);
  });

  it("does not create a duplicate lead for a repeat email — same identity/dedup model as every other surface", async () => {
    const first = await submitProjectInquiry(validInput({ email: "repeat.inquiry@example.com" }), "nonce-3a", repo());
    const second = await submitProjectInquiry(validInput({ email: "REPEAT.inquiry@example.com" }), "nonce-3b", repo());
    expect(first.success && second.success).toBe(true);
    if (!first.success || !second.success) return;
    expect(second.leadId).toBe(first.leadId);
  });

  it("maps the chosen service to a real ProjectType on the persisted project request", async () => {
    const result = await submitProjectInquiry(validInput({ email: "mapping.test@example.com", service: "mobile-app" }), "nonce-4", repo());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const requests = await db.select().from(projectRequests);
    const created = requests.find((r) => r.leadId === result.leadId);
    expect(created?.projectType).toBe("mobile-app");
  });

  it("forwards a normalized payload to MagicFlux exactly once after successful persistence", async () => {
    await submitProjectInquiry(validInput({ email: "forward.test@example.com" }), "nonce-5", repo());
    expect(forwardLeadToMagicFluxMock).toHaveBeenCalledTimes(1);
    const [payload, idempotencyKey] = forwardLeadToMagicFluxMock.mock.calls[0]!;
    expect((payload as { email: string }).email).toBe("forward.test@example.com");
    expect((payload as { source: string }).source).toBe("sigma_plus_agency");
    expect(idempotencyKey).toBe("nonce-5");
  });

  it("records a magicflux_forwarded activity with only safe, non-PII metadata on SENT", async () => {
    const result = await submitProjectInquiry(validInput({ email: "activity.test@example.com" }), "nonce-6", repo());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const activities = (await db.select().from(leadActivities)).filter((a) => a.leadId === result.leadId);
    const forwarded = activities.find((a) => a.type === "magicflux_forwarded");
    expect(forwarded).toBeDefined();
    expect(forwarded?.metadata).toEqual({ outcome: "SENT", executionId: "exec_1", errorReason: undefined });
  });

  it("a MagicFlux FAILURE never changes the submission's success result — the lead is already safely persisted", async () => {
    forwardLeadToMagicFluxMock.mockResolvedValue({ outcome: "FAILED", errorReason: "http_401" });
    const result = await submitProjectInquiry(validInput({ email: "failure.test@example.com" }), "nonce-7", repo());
    expect(result.success).toBe(true);
  });

  it("a MagicFlux bridge that throws is caught and never propagates — submission still succeeds", async () => {
    forwardLeadToMagicFluxMock.mockRejectedValue(new Error("network boom"));
    const result = await submitProjectInquiry(validInput({ email: "throw.test@example.com" }), "nonce-8", repo());
    expect(result.success).toBe(true);
  });

  it("does not record a magicflux_forwarded activity when the outcome is SKIPPED (not configured)", async () => {
    forwardLeadToMagicFluxMock.mockResolvedValue({ outcome: "SKIPPED" });
    const result = await submitProjectInquiry(validInput({ email: "skipped.test@example.com" }), "nonce-9", repo());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const activities = (await db.select().from(leadActivities)).filter((a) => a.leadId === result.leadId);
    expect(activities.some((a) => a.type === "magicflux_forwarded")).toBe(false);
  });
});
