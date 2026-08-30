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
import type { AdminActor } from "@/domain/admin-user";

let db: AppDatabase;
let service: CrmService;
let actor: AdminActor;

async function seedLead(overrides: Partial<{ name: string; email: string; language: string; source: "contact_form" | "project_builder"; status: string }> = {}) {
  const leadRepo = createTestLeadRepository(async () => db);
  const email = overrides.email ?? `person-${Math.random().toString(36).slice(2)}@example.com`;
  const lead = await leadRepo.createLead({
    publicReference: generatePublicReference(),
    name: overrides.name ?? "Test Person",
    email,
    emailNormalized: normalizeEmail(email),
    language: overrides.language ?? "fr",
    source: overrides.source ?? "contact_form",
  });
  await leadRepo.createActivity(lead.id, "lead_created", {});
  return lead;
}

beforeAll(async () => {
  db = await createTestDb();
  const crmRepo = createTestCrmRepository(async () => db);
  const auditRepo = createTestAuditLogRepository(async () => db);
  service = new CrmService(crmRepo, auditRepo);

  // lead_notes.author_id is a real FK to admin_users — seed a genuine
  // admin row rather than an arbitrary UUID so note-creation tests
  // exercise the actual constraint instead of a value that happens to
  // parse as a UUID.
  const adminUserRepo = createTestAdminUserRepository(async () => db);
  const user = await adminUserRepo.upsert({
    email: "admin@example.com",
    emailNormalized: "admin@example.com",
    passwordHash: await hashPassword("test-password-123456"),
    name: "Test Admin",
    role: "ADMIN",
  });
  actor = { id: user.id, email: user.email, name: user.name, role: user.role };
});

describe("CrmService.listLeads", () => {
  it("finds a lead by name search", async () => {
    const lead = await seedLead({ name: "Unique Searchable Name" });
    const result = await service.listLeads({ search: "Searchable" }, { field: "createdAt", direction: "desc" }, 1, 20);
    expect(result.items.some((i) => i.id === lead.id)).toBe(true);
  });

  it("filters by source", async () => {
    await seedLead({ source: "project_builder" });
    const result = await service.listLeads({ source: "project_builder" }, { field: "createdAt", direction: "desc" }, 1, 50);
    expect(result.items.every((i) => i.source === "project_builder")).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("paginates correctly", async () => {
    for (let i = 0; i < 3; i++) await seedLead({ name: `Pagination Test ${i}` });
    const page1 = await service.listLeads({ search: "Pagination Test" }, { field: "createdAt", direction: "desc" }, 1, 2);
    const page2 = await service.listLeads({ search: "Pagination Test" }, { field: "createdAt", direction: "desc" }, 2, 2);
    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(1);
    const ids = new Set([...page1.items, ...page2.items].map((i) => i.id));
    expect(ids.size).toBe(3);
  });
});

describe("CrmService.changeLeadStatus", () => {
  it("changes status, records a lead activity, and an audit log entry", async () => {
    const lead = await seedLead();
    const result = await service.changeLeadStatus(lead.id, "CONTACTED", actor);
    expect(result).toEqual({ success: true, lead: expect.objectContaining({ id: lead.id, status: "CONTACTED" }) });

    const detail = await service.getLeadDetail(lead.id);
    const statusActivity = detail?.activities.find((a) => a.type === "status_changed");
    expect(statusActivity?.metadata).toMatchObject({ previousStatus: "NEW", newStatus: "CONTACTED", actorEmail: actor.email });

    const recentAudit = await service.getRecentAuditLog(50);
    expect(recentAudit.some((e) => e.action === "status_changed" && e.targetId === lead.id)).toBe(true);
  });

  it("rejects an invalid status value", async () => {
    const lead = await seedLead();
    const result = await service.changeLeadStatus(lead.id, "NOT_A_REAL_STATUS", actor);
    expect(result).toEqual({ success: false, error: "invalid_status" });
  });

  it("rejects a no-op status change", async () => {
    const lead = await seedLead();
    const result = await service.changeLeadStatus(lead.id, "NEW", actor);
    expect(result).toEqual({ success: false, error: "unchanged" });
  });

  it("returns not_found for a nonexistent lead", async () => {
    const result = await service.changeLeadStatus("00000000-0000-0000-0000-000000000000", "CONTACTED", actor);
    expect(result).toEqual({ success: false, error: "not_found" });
  });
});

describe("CrmService.addNote", () => {
  it("creates a note, an activity, and an audit log entry", async () => {
    const lead = await seedLead();
    const result = await service.addNote(lead.id, "Called the client, waiting on budget confirmation.", actor);
    expect(result.success).toBe(true);

    const detail = await service.getLeadDetail(lead.id);
    expect(detail?.notes[0]?.note).toBe("Called the client, waiting on budget confirmation.");
    expect(detail?.notes[0]?.authorName).toBe(actor.name);
    expect(detail?.activities.some((a) => a.type === "internal_note_added")).toBe(true);

    const recentAudit = await service.getRecentAuditLog(50);
    expect(recentAudit.some((e) => e.action === "note_added" && e.targetId === lead.id)).toBe(true);
  });

  it("rejects an empty note", async () => {
    const lead = await seedLead();
    const result = await service.addNote(lead.id, "   ", actor);
    expect(result).toEqual({ success: false, error: "invalid_note" });
  });

  it("rejects an oversized note", async () => {
    const lead = await seedLead();
    const result = await service.addNote(lead.id, "x".repeat(2001), actor);
    expect(result).toEqual({ success: false, error: "invalid_note" });
  });

  it("returns not_found for a nonexistent lead", async () => {
    const result = await service.addNote("00000000-0000-0000-0000-000000000000", "hello", actor);
    expect(result).toEqual({ success: false, error: "not_found" });
  });
});

describe("CrmService dashboard + pipeline", () => {
  it("dashboard metrics reflect real counts (no fabricated data)", async () => {
    const before = await service.getDashboardMetrics();
    await seedLead({ name: "Dashboard Count Check" });
    const after = await service.getDashboardMetrics();
    expect(after.totalLeads).toBe(before.totalLeads + 1);
  });

  it("groups pipeline leads under their current canonical status", async () => {
    const lead = await seedLead();
    await service.changeLeadStatus(lead.id, "QUALIFIED", actor);
    const board = await service.getPipelineBoard();
    expect(board.QUALIFIED.some((l) => l.id === lead.id)).toBe(true);
    expect(board.NEW.some((l) => l.id === lead.id)).toBe(false);
  });
});
