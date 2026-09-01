import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { createTestCrmRepository } from "@/lib/repositories/crm-repository";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail } from "@/lib/services/identity";
import { projectRequests } from "@/lib/db/schema";
import type { ProjectRequest } from "@/domain/project-request";

let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

async function seedLead(leadRepo: ReturnType<typeof createTestLeadRepository>) {
  const email = `budget-${Math.random().toString(36).slice(2)}@example.com`;
  return leadRepo.createLead({
    publicReference: generatePublicReference(),
    name: "Budget Test",
    email,
    emailNormalized: normalizeEmail(email),
    language: "en",
    source: "project_builder",
  });
}

const baseProjectRequest: Omit<ProjectRequest, "id" | "createdAt" | "leadId"> = {
  projectType: "website",
  goals: [],
  capabilities: [],
  platforms: [],
  businessState: "new-idea",
  timeline: "flexible",
  budgetRange: "5000-15000",
  structuredBrief: { projectType: "", primaryGoals: [], requestedCapabilities: [], platforms: [], timeline: "", investmentRange: "", businessContext: "", openQuestions: [] },
  locale: "en",
};

describe("Phase 11 budget currency fields — backward compatibility", () => {
  it("persists and reads back currency/min/max when provided", async () => {
    const leadRepo = createTestLeadRepository(async () => db);
    const lead = await seedLead(leadRepo);

    const created = await leadRepo.createProjectRequest({
      ...baseProjectRequest,
      leadId: lead.id,
      budgetCurrency: "DZD",
      budgetMinAmount: 700_000,
      budgetMaxAmount: 2_000_000,
    });

    expect(created.budgetCurrency).toBe("DZD");
    expect(created.budgetMinAmount).toBe(700_000);
    expect(created.budgetMaxAmount).toBe(2_000_000);
    expect(created.budgetRange).toBe("5000-15000"); // stable id unaffected by currency
  });

  it("a row with no currency info (simulating a pre-Phase-11 row) reads back as undefined, never a fabricated default", async () => {
    const leadRepo = createTestLeadRepository(async () => db);
    const lead = await seedLead(leadRepo);

    // Insert directly, bypassing the service layer, to simulate a row
    // that predates budgetCurrency/budgetMinAmount/budgetMaxAmount —
    // these columns are nullable specifically so this is valid.
    const [rawRow] = await db
      .insert(projectRequests)
      .values({ ...baseProjectRequest, leadId: lead.id })
      .returning();

    expect(rawRow!.budgetCurrency).toBeNull();
    expect(rawRow!.budgetMinAmount).toBeNull();
    expect(rawRow!.budgetMaxAmount).toBeNull();

    // Read it back through the same repository real code paths use —
    // the CRM repository's mapper must turn that null into `undefined`,
    // never crash and never guess a currency it was never told.
    const crmRepo = createTestCrmRepository(async () => db);
    const detail = await crmRepo.getProjectRequestsForLead(lead.id);
    const found = detail.find((pr) => pr.id === rawRow!.id)!;

    expect(found.budgetCurrency).toBeUndefined();
    expect(found.budgetMinAmount).toBeUndefined();
    expect(found.budgetMaxAmount).toBeUndefined();
    expect(found.budgetRange).toBe("5000-15000");
  });
});
