import { describe, it, expect, vi } from "vitest";
import { submissionRateLimiter, isDistributedRateLimitingConfigured } from "@/lib/security/rate-limit";

describe("RateLimiter contract (via the in-memory implementation)", () => {
  it("allows up to the configured limit then denies", async () => {
    const key = `test-key-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(await submissionRateLimiter.check(key)).toBe(true);
    }
    expect(await submissionRateLimiter.check(key)).toBe(false);
  });

  it("tracks keys independently", async () => {
    const keyA = `test-key-a-${Math.random()}`;
    const keyB = `test-key-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) await submissionRateLimiter.check(keyA);
    expect(await submissionRateLimiter.check(keyA)).toBe(false);
    expect(await submissionRateLimiter.check(keyB)).toBe(true);
  });

  it("allows again once the window has fully passed", async () => {
    vi.useFakeTimers();
    try {
      const key = `test-key-window-${Math.random()}`;
      for (let i = 0; i < 5; i++) await submissionRateLimiter.check(key);
      expect(await submissionRateLimiter.check(key)).toBe(false);

      vi.advanceTimersByTime(11 * 60 * 1000); // past the 10-minute window
      expect(await submissionRateLimiter.check(key)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("isDistributedRateLimitingConfigured", () => {
  it("is false without Upstash credentials configured", () => {
    expect(isDistributedRateLimitingConfigured()).toBe(false);
  });
});
