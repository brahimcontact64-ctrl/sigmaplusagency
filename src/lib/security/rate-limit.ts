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

// Admin login: 10 attempts / 15 minutes per IP, AND per attempted
// email, so a distributed attacker still gets throttled per-account
// even while rotating source IPs. Same in-memory caveat as above —
// needs Redis before this runs on more than one instance.
export const loginIpRateLimiter: RateLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);
export const loginEmailRateLimiter: RateLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);

// AI consultant: each message is a real provider API call with a real
// cost, so this is deliberately tighter than the plain-form limiter
// above. Per-session AND per-IP so one browser session can't just get
// a fresh sessionId to reset its own limit.
export const aiMessageSessionRateLimiter: RateLimiter = new InMemoryRateLimiter(20, 10 * 60 * 1000);
export const aiMessageIpRateLimiter: RateLimiter = new InMemoryRateLimiter(40, 10 * 60 * 1000);

// Analytics ingestion (/api/analytics/event): generous, since a single
// real page visit can legitimately fire several events (page_view,
// scroll-driven cta_click, project_builder_step_completed, ...). This
// exists to blunt an endpoint being turned into an arbitrary write
// amplifier, not to throttle real usage. Checked against both the
// caller-supplied anonymous session id and the request IP, same
// belt-and-suspenders shape as the login limiter above.
export const analyticsEventRateLimiter: RateLimiter = new InMemoryRateLimiter(120, 10 * 60 * 1000);
