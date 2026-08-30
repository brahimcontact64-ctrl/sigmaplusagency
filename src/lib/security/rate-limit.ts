/**
 * Provider-agnostic rate limiting. This in-memory implementation is
 * fine for a single Node process (dev, and small production deploys)
 * but resets on restart and doesn't share state across instances —
 * swap the internals for Redis/Upstash before scaling horizontally.
 * The interface is what matters: callers never touch the storage.
 */
export interface RateLimiter {
  /** Returns true if the request should be ALLOWED. */
  check(key: string): boolean;
}

class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (timestamps.length >= this.limit) {
      this.hits.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    // Cheap cleanup so this map doesn't grow unbounded under sustained traffic.
    if (this.hits.size > 5000) {
      for (const [k, ts] of this.hits) {
        if (ts.every((t) => t <= windowStart)) this.hits.delete(k);
      }
    }

    return true;
  }
}

// 5 submissions per 10 minutes per key (IP, normally) — generous for a
// real visitor retrying after a validation fix, tight enough to blunt
// naive scripted abuse of a form with no CAPTCHA yet.
export const submissionRateLimiter: RateLimiter = new InMemoryRateLimiter(5, 10 * 60 * 1000);
