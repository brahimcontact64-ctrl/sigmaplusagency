import { describe, it, expect, afterEach, vi } from "vitest";
import { getDb } from "@/lib/db/client";

/**
 * The Phase 4 persistence invariant, reconfirmed explicitly for Phase 7:
 * production must never silently fall back to an embedded/in-memory
 * database for real persistence (leads, project requests, activities,
 * admin users, AI conversations — every repository shares this same
 * getDb() singleton, see src/lib/repositories/*.ts constructors). This
 * is distinct from src/lib/effective-config.ts, which is allowed to
 * fall back to env `siteConfig` if the *settings* read fails — that's
 * a cosmetic contact-info default, never a persistence decision, and
 * it never touches this function's throw behavior.
 */
describe("getDb() production persistence policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws synchronously in production with no DATABASE_URL, rather than falling back to an embedded database", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getDb()).toThrow(/DATABASE_URL is not configured/);
  });
});
