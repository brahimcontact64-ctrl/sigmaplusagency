import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { createTestCrmRepository } from "@/lib/repositories/crm-repository";
import { createTestAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { createTestAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { CrmService } from "@/lib/services/crm-service";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail } from "@/lib/services/identity";
import { hashPassword } from "@/lib/auth/password";
import { toMinorUnits } from "@/lib/money";
import type { AdminActor } from "@/domain/admin-user";

let db: AppDatabase;
let service: CrmService;
let actor: AdminActor;

async function seedLead() {
  const leadRepo = createTestLeadRepository(async () => db);
  const email = `deal-${Math.random().toString(36).slice(2)}@example.com`;
  return leadRepo.createLead({
    publicReference: generatePublicReference(),
    name: "Deal Test",
    email,
    emailNormalized: normalizeEmail(email),
    language: "en",
    source: "project_builder",
  });
}

beforeAll(async () => {
  db = await createTestDb();
  const crmRepo = createTestCrmRepository(async () => db);
  const auditRepo = createTestAuditLogRepository(async () => db);
  service = new CrmService(crmRepo, auditRepo);

  // admin_audit_logs.actor_id is a real FK to admin_users — seed a
  // genuine admin row rather than an arbitrary UUID, same reasoning as
  // crm-service.test.ts.
  const adminUserRepo = createTestAdminUserRepository(async () => db);
  const user = await adminUserRepo.upsert({
    email: "admin@example.com",
    emailNormalized: "admin@example.com",
    passwordHash: await hashPassword("test-password-123456"),
    name: "Test Admin",
    role: "OWNER",
  });
  actor = { id: user.id, email: user.email, name: user.name, role: user.role };
});

describe("CrmService.setDealValue", () => {
  it("stores a manually entered deal value in integer minor units", async () => {
    const lead = await seedLead();
    const result = await service.setDealValue(lead.id, toMinorUnits(1500), "EUR", actor);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.lead.dealValueMinorUnits).toBe(150000);
      expect(result.lead.dealCurrency).toBe("EUR");
    }
  });

  it("rejects an unsupported currency", async () => {
    const lead = await seedLead();
    const result = await service.setDealValue(lead.id, 100000, "BTC", actor);
    expect(result).toEqual({ success: false, error: "invalid_currency" });
  });

  it("rejects a negative or non-integer value", async () => {
    const lead = await seedLead();
    expect(await service.setDealValue(lead.id, -1, "EUR", actor)).toEqual({ success: false, error: "invalid_value" });
    expect(await service.setDealValue(lead.id, 10.5, "EUR", actor)).toEqual({ success: false, error: "invalid_value" });
  });

  it("returns not_found for a nonexistent lead", async () => {
    const result = await service.setDealValue("00000000-0000-0000-0000-000000000099", 1000, "EUR", actor);
    expect(result).toEqual({ success: false, error: "not_found" });
  });
});

describe("CrmService.setLostReason", () => {
  it("stores a structured lost reason with an optional note", async () => {
    const lead = await seedLead();
    const result = await service.setLostReason(lead.id, "BUDGET", "Client chose a cheaper competitor.", actor);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.lead.lostReason).toBe("BUDGET");
      expect(result.lead.lostNote).toBe("Client chose a cheaper competitor.");
    }
  });

  it("rejects an invalid reason code", async () => {
    const lead = await seedLead();
    const result = await service.setLostReason(lead.id, "NOT_A_REAL_REASON", undefined, actor);
    expect(result).toEqual({ success: false, error: "invalid_reason" });
  });

  it("accepts a reason with no note", async () => {
    const lead = await seedLead();
    const result = await service.setLostReason(lead.id, "TIMING", undefined, actor);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.lead.lostNote).toBeUndefined();
    }
  });
});

describe("wonAt-once behavior", () => {
  it("sets wonAt exactly once on first transition to WON, and preserves it across later moves away and back", async () => {
    const lead = await seedLead();
    const crmRepo = createTestCrmRepository(async () => db);

    const won = await crmRepo.updateLeadStatus(lead.id, "WON");
    expect(won?.wonAt).toBeInstanceOf(Date);
    const firstWonAt = won!.wonAt!.getTime();

    // Move away from WON and back — the original win date must not change.
    await crmRepo.updateLeadStatus(lead.id, "NEGOTIATION");
    await new Promise((r) => setTimeout(r, 5));
    const wonAgain = await crmRepo.updateLeadStatus(lead.id, "WON");
    expect(wonAgain?.wonAt?.getTime()).toBe(firstWonAt);
  });
});
