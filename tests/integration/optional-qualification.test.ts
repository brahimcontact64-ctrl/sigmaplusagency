import { describe, it, expect, beforeAll, vi } from "vitest";

// Same pragmatic mock as lead-service.test.ts — buildStructuredBrief
// (called internally by attachOptionalQualification) needs
// next-intl/server's getTranslations, which transitively pulls in
// next/headers outside of a real Next.js runtime.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = (key: string) => key;
    return t;
  },
}));

import { eq } from "drizzle-orm";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { submitProjectRequest, attachOptionalQualification } from "@/lib/services/lead-service";
import { leads, projectRequests } from "@/lib/db/schema";

let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

function repo() {
  return createTestLeadRepository(async () => db);
}

async function findProjectRequest(id: string) {
  const [row] = await db.select().from(projectRequests).where(eq(projectRequests.id, id));
  return row;
}

let phoneCounter = 0;

// Each seed uses both a distinct email AND a distinct phone — the
// dedup logic in findOrCreateLead matches on email first, then falls
// back to phone, so two seeds sharing either would silently collapse
// into the SAME lead and defeat the cross-lead ownership test below.
async function seedProjectRequest(email: string) {
  phoneCounter += 1;
  const result = await submitProjectRequest(
    {
      projectType: "mobile-app",
      goals: [],
      capabilities: [],
      platforms: [],
      businessState: "new-idea",
      timeline: "asap",
      budgetRange: "1000-5000",
      name: "Qualification Test",
      email,
      phone: `055047${String(phoneCounter).padStart(4, "0")}`,
      message: "I want a mobile app for my restaurant to take orders.",
      locale: "en",
    },
    repo(),
  );
  if (!result.success) throw new Error("seed submission failed");
  return result;
}

describe("attachOptionalQualification — Project Builder v2 §3", () => {
  it("attaches goals/capabilities/platforms to the existing project request without creating a new lead or request", async () => {
    const seeded = await seedProjectRequest("qualify-1@example.com");

    const leadsBefore = (await db.select().from(leads)).length;
    const requestsBefore = (await db.select().from(projectRequests)).length;

    const result = await attachOptionalQualification(
      {
        reference: seeded.reference,
        projectRequestId: seeded.projectRequestId,
        goals: ["take-bookings"],
        capabilities: ["notifications"],
        platforms: ["ios", "android"],
      },
      repo(),
    );

    expect(result.success).toBe(true);

    const leadsAfter = (await db.select().from(leads)).length;
    const requestsAfter = (await db.select().from(projectRequests)).length;
    expect(leadsAfter).toBe(leadsBefore);
    expect(requestsAfter).toBe(requestsBefore);

    const updated = await findProjectRequest(seeded.projectRequestId);
    expect(updated?.goals).toEqual(["take-bookings"]);
    expect(updated?.capabilities).toEqual(["notifications"]);
    expect(updated?.platforms).toEqual(["ios", "android"]);
    // The stable qualification bucket must never be touched by this pathway.
    expect(updated?.budgetRange).toBe("1000-5000");
  });

  it("regenerates the structured brief so it reflects the newly-supplied goals", async () => {
    const seeded = await seedProjectRequest("qualify-2@example.com");

    await attachOptionalQualification(
      { reference: seeded.reference, projectRequestId: seeded.projectRequestId, goals: ["take-bookings"], capabilities: [], platforms: [] },
      repo(),
    );

    const updated = await findProjectRequest(seeded.projectRequestId);
    const brief = updated?.structuredBrief as { primaryGoals: string[] };
    // The mocked getTranslations returns the key itself (see the
    // vi.mock at the top of this file), so the label is the raw
    // "goals.take-bookings" key rather than real translated copy —
    // real localized labels are covered by the Next.js dev-server
    // manual pass, same as lead-service.test.ts's existing brief tests.
    expect(brief.primaryGoals).toContain("goals.take-bookings");
  });

  it("rejects when the projectRequestId doesn't belong to the referenced lead (ownership check)", async () => {
    const seededA = await seedProjectRequest("qualify-owner-a@example.com");
    const seededB = await seedProjectRequest("qualify-owner-b@example.com");

    // Attempt to attach qualification to B's request using A's reference.
    const result = await attachOptionalQualification(
      { reference: seededA.reference, projectRequestId: seededB.projectRequestId, goals: ["take-bookings"], capabilities: [], platforms: [] },
      repo(),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("not_found");

    // Confirm B's row was NOT modified by the mismatched attempt.
    const untouched = await findProjectRequest(seededB.projectRequestId);
    expect(untouched?.goals).toEqual([]);
  });

  it("rejects an unknown reference without throwing", async () => {
    const seeded = await seedProjectRequest("qualify-3@example.com");
    const result = await attachOptionalQualification(
      { reference: "SP-ZZZZZZ", projectRequestId: seeded.projectRequestId, goals: [], capabilities: [], platforms: [] },
      repo(),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("not_found");
  });
});
