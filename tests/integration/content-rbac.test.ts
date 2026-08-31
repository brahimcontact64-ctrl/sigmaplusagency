import { describe, it, expect } from "vitest";
import { assertRole } from "@/lib/auth/rbac";
import { CONTENT_EDITOR_ROLES, SEO_EDITOR_ROLES } from "@/domain/admin-user";
import type { AdminActor, AdminRole } from "@/domain/admin-user";

function actorWithRole(role: AdminRole): AdminActor {
  return { id: "1", email: "a@example.com", name: "A", role };
}

describe("Content editorial RBAC (Phase 8 §56)", () => {
  it("OWNER, ADMIN, and EDITOR can edit content", () => {
    for (const role of ["OWNER", "ADMIN", "EDITOR"] as const) {
      expect(() => assertRole(actorWithRole(role), CONTENT_EDITOR_ROLES)).not.toThrow();
    }
  });

  it("SALES cannot publish/edit content, even though it can act on leads", () => {
    expect(() => assertRole(actorWithRole("SALES"), CONTENT_EDITOR_ROLES)).toThrow(/Forbidden/);
  });

  it("VIEWER cannot edit content", () => {
    expect(() => assertRole(actorWithRole("VIEWER"), CONTENT_EDITOR_ROLES)).toThrow(/Forbidden/);
  });
});

describe("SEO recommendation approval RBAC", () => {
  it("OWNER and ADMIN can approve/reject recommendations", () => {
    for (const role of ["OWNER", "ADMIN"] as const) {
      expect(() => assertRole(actorWithRole(role), SEO_EDITOR_ROLES)).not.toThrow();
    }
  });

  it("EDITOR cannot approve SEO recommendations (tighter than general content editing)", () => {
    expect(() => assertRole(actorWithRole("EDITOR"), SEO_EDITOR_ROLES)).toThrow(/Forbidden/);
  });
});
