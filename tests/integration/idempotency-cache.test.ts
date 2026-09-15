import { describe, it, expect, vi } from "vitest";
import { withIdempotency } from "@/lib/security/idempotency-cache";

describe("withIdempotency — duplicate-submission guard (brief §7)", () => {
  it("runs fn only once for concurrent calls sharing the same key, and both callers get the same result", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      return `result-${callCount}`;
    };

    const key = `dup-${Math.random()}`;
    const [a, b] = await Promise.all([withIdempotency(key, fn), withIdempotency(key, fn)]);

    expect(callCount).toBe(1);
    expect(a).toBe(b);
  });

  it("a rapid sequential duplicate (not just concurrent) within the TTL also reuses the cached result", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return callCount;
    };

    const key = `seq-${Math.random()}`;
    const first = await withIdempotency(key, fn, 60_000);
    const second = await withIdempotency(key, fn, 60_000);

    expect(callCount).toBe(1);
    expect(first).toBe(second);
  });

  it("different keys run independently — no cross-submission interference", async () => {
    let callCount = 0;
    const fn = async () => ++callCount;

    const a = await withIdempotency(`independent-a-${Math.random()}`, fn);
    const b = await withIdempotency(`independent-b-${Math.random()}`, fn);

    expect(a).not.toBe(b);
    expect(callCount).toBe(2);
  });

  it("a failed attempt does not poison the key — a retry with the same key runs again", async () => {
    let attempt = 0;
    const fn = async () => {
      attempt++;
      if (attempt === 1) throw new Error("transient failure");
      return "success";
    };

    const key = `retry-${Math.random()}`;
    await expect(withIdempotency(key, fn)).rejects.toThrow("transient failure");
    const result = await withIdempotency(key, fn);
    expect(result).toBe("success");
    expect(attempt).toBe(2);
  });

  it("expires after the TTL — a call after expiry runs fn again with a fresh result", async () => {
    vi.useFakeTimers();
    try {
      let callCount = 0;
      const fn = async () => ++callCount;
      const key = `ttl-${Math.random()}`;

      const first = await withIdempotency(key, fn, 100);
      expect(first).toBe(1);

      await vi.advanceTimersByTimeAsync(200);

      const second = await withIdempotency(key, fn, 100);
      expect(second).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
