import { describe, it, expect, afterEach, vi } from "vitest";
import { isValidCronAuthorization } from "@/lib/security/cron-auth";

describe("isValidCronAuthorization — Phase 12 §3 cron endpoint auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when CRON_SECRET is not configured at all, even with a plausible-looking header", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isValidCronAuthorization("Bearer anything")).toBe(false);
  });

  it("rejects a missing Authorization header", () => {
    vi.stubEnv("CRON_SECRET", "real-secret-value");
    expect(isValidCronAuthorization(null)).toBe(false);
  });

  it("rejects an incorrect secret", () => {
    vi.stubEnv("CRON_SECRET", "real-secret-value");
    expect(isValidCronAuthorization("Bearer wrong-secret-value")).toBe(false);
  });

  it("rejects a header missing the Bearer prefix", () => {
    vi.stubEnv("CRON_SECRET", "real-secret-value");
    expect(isValidCronAuthorization("real-secret-value")).toBe(false);
  });

  it("accepts the exact correct Bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "real-secret-value");
    expect(isValidCronAuthorization("Bearer real-secret-value")).toBe(true);
  });

  it("rejects a secret that merely starts with the same characters (no length coincidence bypass)", () => {
    vi.stubEnv("CRON_SECRET", "abc");
    expect(isValidCronAuthorization("Bearer abcdef")).toBe(false);
    expect(isValidCronAuthorization("Bearer ab")).toBe(false);
  });
});

describe("isValidSeoJobType — Phase 12 §8 cron job-type allowlist", () => {
  it("accepts every real job type", async () => {
    const { SEO_JOB_TYPES, isValidSeoJobType } = await import("@/domain/seo-job");
    for (const jobType of SEO_JOB_TYPES) {
      expect(isValidSeoJobType(jobType)).toBe(true);
    }
  });

  it("rejects an arbitrary/unknown string — no arbitrary job/function invocation is reachable", async () => {
    const { isValidSeoJobType } = await import("@/domain/seo-job");
    expect(isValidSeoJobType("DROP_TABLE_LEADS")).toBe(false);
    expect(isValidSeoJobType("__proto__")).toBe(false);
    expect(isValidSeoJobType("constructor")).toBe(false);
  });

  it("rejects null/undefined/empty string", async () => {
    const { isValidSeoJobType } = await import("@/domain/seo-job");
    expect(isValidSeoJobType(null)).toBe(false);
    expect(isValidSeoJobType(undefined)).toBe(false);
    expect(isValidSeoJobType("")).toBe(false);
  });
});
