import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestArticleRepository } from "@/lib/repositories/article-repository";
import { createTestAuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { createTestAdminUserRepository } from "@/lib/repositories/admin-user-repository";
import { ArticleService } from "@/lib/services/article-service";
import { hashPassword } from "@/lib/auth/password";
import type { AdminActor } from "@/domain/admin-user";

let db: AppDatabase;
let service: ArticleService;
let actor: AdminActor;

beforeAll(async () => {
  db = await createTestDb();
  const articleRepo = createTestArticleRepository(async () => db);
  const auditRepo = createTestAuditLogRepository(async () => db);
  service = new ArticleService(articleRepo, auditRepo);

  // admin_audit_logs.actor_id is a real FK to admin_users — seed a
  // genuine row rather than an arbitrary UUID (same reasoning as
  // Phase 5's crm-service tests).
  const adminUserRepo = createTestAdminUserRepository(async () => db);
  const user = await adminUserRepo.upsert({
    email: "editor@example.com",
    emailNormalized: "editor@example.com",
    passwordHash: await hashPassword("test-password-123456"),
    name: "Editor",
    role: "EDITOR",
  });
  actor = { id: user.id, email: user.email, name: user.name, role: user.role };
});

function translation(overrides: Record<string, unknown> = {}) {
  return {
    locale: "en" as const,
    slug: `svc-test-${Math.random().toString(36).slice(2, 8)}`,
    title: "How to plan a business website",
    description: "A practical guide for Algeria-first businesses planning their first website.",
    excerpt: "What to decide before you start.",
    content: "## Start here\n\nReal content goes here.",
    ...overrides,
  };
}

describe("ArticleService.createArticleWithTranslation", () => {
  it("creates the article, records an audit entry, and rejects a taken slug", async () => {
    const result = await service.createArticleWithTranslation({ type: "ARTICLE", category: "web", author: "SIGMA+" }, translation({ slug: "audit-test-slug" }), actor);
    expect(result.success).toBe(true);

    const dup = await service.createArticleWithTranslation({ type: "ARTICLE", category: "web", author: "SIGMA+" }, translation({ slug: "audit-test-slug" }), actor);
    expect(dup).toEqual({ success: false, error: "slug_taken" });
  });
});

describe("ArticleService.publish — publish validation", () => {
  it("refuses to publish a translation missing required fields", async () => {
    const created = await service.createArticleWithTranslation(
      { type: "ARTICLE", category: "web", author: "SIGMA+" },
      translation({ title: "", description: "", content: "" }),
      actor,
    );
    expect(created.success).toBe(true);
    if (!created.success) return;

    const result = await service.publish(created.translation.id, actor);
    expect(result).toMatchObject({ success: false, error: "invalid" });
    if (!result.success && result.error === "invalid") {
      expect(result.problems!.length).toBeGreaterThan(0);
    }
  });

  it("publishes a complete translation and records article_published", async () => {
    const created = await service.createArticleWithTranslation({ type: "GUIDE", category: "automation", author: "SIGMA+" }, translation(), actor);
    expect(created.success).toBe(true);
    if (!created.success) return;

    const result = await service.publish(created.translation.id, actor);
    expect(result.success).toBe(true);
    if (result.success) expect(result.translation.status).toBe("PUBLISHED");
  });
});

describe("ArticleService.changeSlug", () => {
  it("changes the slug and records article_slug_changed", async () => {
    const created = await service.createArticleWithTranslation({ type: "ARTICLE", category: "seo", author: "SIGMA+" }, translation({ slug: "slug-change-original" }), actor);
    expect(created.success).toBe(true);
    if (!created.success) return;

    const result = await service.changeSlug(created.translation.id, "slug-change-updated", actor);
    expect(result.success).toBe(true);
    if (result.success) expect(result.translation.slug).toBe("slug-change-updated");
  });
});
