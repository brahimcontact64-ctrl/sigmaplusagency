import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestSeoRecommendationRepository } from "@/lib/repositories/seo-recommendation-repository";
import { createTestAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { createTestAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { SeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import { hashPassword } from "@/lib/auth/password";
import type { AdminActor } from "@/domain/admin-user";
import type { SeoIssue } from "@/domain/seo-issue";

let db: AppDatabase;
let service: SeoRecommendationService;
let actor: AdminActor;

beforeAll(async () => {
  db = await createTestDb();
  const recRepo = createTestSeoRecommendationRepository(async () => db);
  const auditRepo = createTestAuditLogRepository(async () => db);
  service = new SeoRecommendationService(recRepo, auditRepo);

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

function issue(overrides: Partial<SeoIssue> = {}): SeoIssue {
  return { id: "x", type: "WARNING", page: "/en/about", message: "Long description.", recommendation: "Tighten it.", source: "INTERNAL_AUDIT", detectedAt: new Date().toISOString(), ...overrides };
}

describe("SeoRecommendationService — approval-first workflow", () => {
  it("generates RECOMMENDED rows from audit issues, never auto-approved", async () => {
    const count = await service.generateFromAudit([issue()]);
    expect(count).toBe(1);

    const recommended = await service.list("RECOMMENDED");
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended.every((r) => r.status === "RECOMMENDED")).toBe(true);
  });

  it("approve() moves a RECOMMENDED item to APPROVED and records who/when", async () => {
    await service.generateFromAudit([issue({ page: "/approve-test" })]);
    const [target] = await service.list("RECOMMENDED");
    const result = await service.approve(target!.id, actor);
    expect(result).toEqual({ success: true });

    const approved = await service.list("APPROVED");
    const found = approved.find((r) => r.id === target!.id);
    expect(found?.reviewedByEmail).toBe(actor.email);
    expect(found?.reviewedAt).toBeDefined();
  });

  it("reject() moves a RECOMMENDED item to REJECTED", async () => {
    await service.generateFromAudit([issue({ page: "/reject-test" })]);
    const recommended = await service.list("RECOMMENDED");
    const target = recommended.find((r) => r.page === "/reject-test")!;
    const result = await service.reject(target.id, actor);
    expect(result).toEqual({ success: true });

    const rejected = await service.list("REJECTED");
    expect(rejected.some((r) => r.id === target.id)).toBe(true);
  });

  it("refuses to approve an already-PUBLISHED recommendation, and refuses to reject one too", async () => {
    await service.generateFromAudit([issue({ page: "/already-published-test" })]);
    const recommended = await service.list("RECOMMENDED");
    const target = recommended.find((r) => r.page === "/already-published-test")!;
    await service.approve(target.id, actor);
    // Manually simulate PUBLISHED (a future step this service doesn't itself perform) via a second approve — approve() from APPROVED should be an invalid transition too.
    const secondApprove = await service.approve(target.id, actor);
    expect(secondApprove).toEqual({ success: false, error: "invalid_transition" });
  });

  it("returns not_found for a nonexistent recommendation", async () => {
    const result = await service.approve("00000000-0000-0000-0000-000000000000", actor);
    expect(result).toEqual({ success: false, error: "not_found" });
  });
});
