import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { createTestAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { AccountService } from "@/lib/services/account-service";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { AdminActor } from "@/domain/admin-user";

let db: AppDatabase;
let service: AccountService;
let actor: AdminActor;

beforeAll(async () => {
  db = await createTestDb();
  const userRepo = createTestAdminUserRepository(async () => db);
  const auditRepo = createTestAuditLogRepository(async () => db);
  service = new AccountService(userRepo, auditRepo);

  const user = await userRepo.upsert({
    email: "changeme@example.com",
    emailNormalized: "changeme@example.com",
    passwordHash: await hashPassword("original-password-123"),
    name: "Changer",
    role: "ADMIN",
  });
  actor = { id: user.id, email: user.email, name: user.name, role: user.role };
});

describe("AccountService.changePassword", () => {
  it("rejects a mismatched confirmation", async () => {
    const result = await service.changePassword(actor, "original-password-123", "new-password-456", "different-456");
    expect(result).toEqual({ success: false, error: "mismatch" });
  });

  it("rejects a weak new password", async () => {
    const result = await service.changePassword(actor, "original-password-123", "short1", "short1");
    expect(result).toEqual({ success: false, error: "weak_password" });
  });

  it("rejects an incorrect current password", async () => {
    const result = await service.changePassword(actor, "totally-wrong", "new-password-456", "new-password-456");
    expect(result).toEqual({ success: false, error: "invalid_current_password" });
  });

  it("accepts a valid change, updates the stored hash, and records an audit entry", async () => {
    const userRepo = createTestAdminUserRepository(async () => db);
    const result = await service.changePassword(actor, "original-password-123", "brand-new-password-789", "brand-new-password-789");
    expect(result).toEqual({ success: true });

    const updated = await userRepo.findByEmailNormalized("changeme@example.com");
    await expect(verifyPassword("brand-new-password-789", updated!.passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("original-password-123", updated!.passwordHash)).resolves.toBe(false);

    const auditRepo = createTestAuditLogRepository(async () => db);
    const recent = await auditRepo.listRecent(20);
    expect(recent.some((e) => e.action === "password_changed" && e.actorId === actor.id)).toBe(true);
  });
});
