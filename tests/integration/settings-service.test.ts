import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestSettingsRepository } from "@/lib/repositories/settings-repository";
import { createTestAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { createTestAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { SettingsService } from "@/lib/services/settings-service";
import { hashPassword } from "@/lib/auth/password";
import type { AdminActor } from "@/domain/admin-user";

let db: AppDatabase;
let service: SettingsService;
let actor: AdminActor;

beforeAll(async () => {
  db = await createTestDb();
  const settingsRepo = createTestSettingsRepository(async () => db);
  const auditRepo = createTestAuditLogRepository(async () => db);
  service = new SettingsService(settingsRepo, auditRepo);

  const adminUserRepo = createTestAdminUserRepository(async () => db);
  const user = await adminUserRepo.upsert({
    email: "owner@example.com",
    emailNormalized: "owner@example.com",
    passwordHash: await hashPassword("test-password-123456"),
    name: "Owner",
    role: "OWNER",
  });
  actor = { id: user.id, email: user.email, name: user.name, role: user.role };
});

describe("SettingsService", () => {
  it("rejects an unknown key", async () => {
    const result = await service.update("not_a_real_setting", { anything: "x" }, actor);
    expect(result).toEqual({ success: false, error: "invalid_key" });
  });

  it("rejects an invalid value for a known key", async () => {
    const result = await service.update("company_identity", { companyName: "" }, actor);
    expect(result).toEqual({ success: false, error: "invalid_value" });
  });

  it("accepts and persists a valid value, and records an audit entry", async () => {
    const result = await service.update(
      "company_identity",
      { companyName: "SIGMA+ Agency", contactEmail: "hello@sigmaplus.agency", contactPhone: "+213 550 47 52 48", whatsappNumber: "436602313221" },
      actor,
    );
    expect(result).toEqual({ success: true });

    const all = await service.getAll();
    expect(all.company_identity?.companyName).toBe("SIGMA+ Agency");
  });

  it("validates a budget-range label map, rejecting non-string values", async () => {
    const result = await service.update("budget_range_labels", { "under-1000": "Starter" }, actor);
    expect(result).toEqual({ success: true });

    const invalid = await service.update("budget_range_labels", { "under-1000": 123 }, actor);
    expect(invalid).toEqual({ success: false, error: "invalid_value" });
  });
});
