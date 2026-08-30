import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { encryptSession, decryptSession } from "@/lib/auth/jwt";
import { assertRole } from "@/lib/auth/rbac";
import type { AdminActor } from "@/domain/admin-user";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different hash (different salt) for the same password each time", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    await expect(verifyPassword("anything", "not-a-valid-hash")).resolves.toBe(false);
  });
});

describe("admin session JWT", () => {
  const payload = { adminUserId: "user-1", email: "owner@example.com", name: "Owner", role: "OWNER" as const };

  it("round-trips a valid session", async () => {
    const token = await encryptSession(payload, new Date(Date.now() + 60_000));
    const decoded = await decryptSession(token);
    expect(decoded).toEqual(payload);
  });

  it("rejects an expired session", async () => {
    const token = await encryptSession(payload, new Date(Date.now() - 1000));
    const decoded = await decryptSession(token);
    expect(decoded).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await encryptSession(payload, new Date(Date.now() + 60_000));
    const lastTwo = token.slice(-2);
    const tampered = token.slice(0, -2) + (lastTwo === "AA" ? "BB" : "AA");
    const decoded = await decryptSession(tampered);
    expect(decoded).toBeNull();
  });

  it("rejects an empty/missing token", async () => {
    await expect(decryptSession(undefined)).resolves.toBeNull();
  });
});

describe("RBAC assertRole", () => {
  const owner: AdminActor = { id: "1", email: "o@example.com", name: "Owner", role: "OWNER" };
  const viewer: AdminActor = { id: "2", email: "v@example.com", name: "Viewer", role: "VIEWER" };

  it("allows a role in the allowed list", () => {
    expect(() => assertRole(owner, ["OWNER", "ADMIN"])).not.toThrow();
  });

  it("throws for a role not in the allowed list", () => {
    expect(() => assertRole(viewer, ["OWNER"])).toThrow(/Forbidden/);
  });
});
