import { isProductionDeployment } from "@/lib/deployment";

/**
 * Provider-agnostic rate limiting. `check()` is async by contract even
 * though the in-memory implementation resolves synchronously — a real
 * distributed backend (Redis/Upstash) is a network call, and every
 * caller already needed to change to `await` it, so the interface
 * reflects the real shape rather than a sync one that would need a
 * breaking change later.
 */
export interface RateLimiter {
  /** Resolves true if the request should be ALLOWED. */
  check(key: string): Promise<boolean>;
}

class InMemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<boolean> {
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

/**
 * Upstash Redis REST-backed limiter (Phase 10 §19) — shares state
 * across every instance, unlike `InMemoryRateLimiter`. Uses the plain
 * REST API via `fetch()` (no Redis client dependency added just for
 * this). Fixed-window counter: `INCR` the key, set its expiry only on
 * the first hit in the window (`EXPIRE ... NX`) so the window doesn't
 * keep sliding forward on every request.
 *
 * Fails OPEN on any network/provider error — a rate-limiter outage
 * must never itself become a denial-of-service against real visitors.
 * The failure is logged, never thrown.
 */
class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly restUrl: string,
    private readonly restToken: string,
  ) {}

  async check(key: string): Promise<boolean> {
    const windowSeconds = Math.max(1, Math.ceil(this.windowMs / 1000));
    try {
      const res = await fetch(`${this.restUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.restToken}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSeconds, "NX"],
        ]),
      });
      if (!res.ok) throw new Error(`Upstash rate-limit request failed with status ${res.status}`);

      const results = (await res.json()) as { result: number }[];
      const count = results[0]?.result ?? 0;
      return count <= this.limit;
    } catch (error) {
      console.error("[rate-limit] Upstash check failed, allowing request (fail-open):", error);
      return true;
    }
  }
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** True when a real distributed backend is configured — never requires these credentials to exist for the app to build or run. */
export function isDistributedRateLimitingConfigured(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    return new UpstashRateLimiter(limit, windowMs, UPSTASH_URL, UPSTASH_TOKEN);
  }
  return new InMemoryRateLimiter(limit, windowMs);
}

// A single-instance production deployment without a distributed
// backend is a real operational limitation, not a silent one — logged
// once at process start so it shows up in platform logs rather than
// only in a doc. Never blocks anything; the in-memory fallback still
// works, just per-instance.
if (isProductionDeployment() && !isDistributedRateLimitingConfigured()) {
  console.warn(
    "[rate-limit] Running in production without UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN configured — rate limits are per-instance (in-memory), not shared across a multi-instance deployment. See docs/PRODUCTION_OPERATIONS.md §5.",
  );
}

// 5 submissions per 10 minutes per key (IP, normally) — generous for a
// real visitor retrying after a validation fix, tight enough to blunt
// naive scripted abuse of a form with no CAPTCHA yet.
export const submissionRateLimiter: RateLimiter = createRateLimiter(5, 10 * 60 * 1000);

// Admin login: 10 attempts / 15 minutes per IP, AND per attempted
// email, so a distributed attacker still gets throttled per-account
// even while rotating source IPs.
export const loginIpRateLimiter: RateLimiter = createRateLimiter(10, 15 * 60 * 1000);
export const loginEmailRateLimiter: RateLimiter = createRateLimiter(10, 15 * 60 * 1000);

// AI consultant: each message is a real provider API call with a real
// cost, so this is deliberately tighter than the plain-form limiter
// above. Per-session AND per-IP so one browser session can't just get
// a fresh sessionId to reset its own limit.
export const aiMessageSessionRateLimiter: RateLimiter = createRateLimiter(20, 10 * 60 * 1000);
export const aiMessageIpRateLimiter: RateLimiter = createRateLimiter(40, 10 * 60 * 1000);

// Analytics ingestion (/api/analytics/event): generous, since a single
// real page visit can legitimately fire several events (page_view,
// scroll-driven cta_click, project_builder_step_completed, ...). This
// exists to blunt an endpoint being turned into an arbitrary write
// amplifier, not to throttle real usage. Checked against both the
// caller-supplied anonymous session id and the request IP, same
// belt-and-suspenders shape as the login limiter above.
export const analyticsEventRateLimiter: RateLimiter = createRateLimiter(120, 10 * 60 * 1000);

// SEO job cron endpoint (/api/internal/seo/run): this is an
// authenticated (CRON_SECRET), internal, machine-to-machine endpoint —
// the schedule itself already bounds how often a legitimate caller
// hits it (at most daily/weekly per job type). This limit exists only
// as a second layer in case the secret ever leaks, not to throttle
// real scheduled traffic.
export const seoJobRateLimiter: RateLimiter = createRateLimiter(30, 60 * 60 * 1000);
