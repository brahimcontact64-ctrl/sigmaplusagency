/**
 * Best-effort submission idempotency guard (brief §7: "Do not create
 * duplicate lead submissions on refresh/double-click"). Coalesces
 * concurrent/rapid-repeat calls sharing the same key into a single
 * real execution — a genuine double-click or an accidental double
 * form-submit event replays the exact same result instead of running
 * the submission logic twice.
 *
 * Same documented, accepted limitation as `rate-limit.ts`'s in-memory
 * fallback: this is per-instance, not distributed — a multi-instance
 * deployment without a shared backend could still process the same
 * key twice if the two requests land on different instances in the
 * same short window. The client always generates a fresh nonce per
 * page load, so this only ever needs to catch a rapid, same-instance
 * duplicate — the same tradeoff already accepted for rate limiting.
 * The consequential, cross-instance-safe protection against a
 * duplicate reaching MagicFlux is `forwardLeadToMagicFlux`'s
 * `Idempotency-Key` header, which MagicFlux's own database-backed
 * unique constraint enforces authoritatively (see
 * lib/runtime/idempotency.ts in the MagicFlux codebase).
 */

const DEFAULT_TTL_MS = 2 * 60 * 1000;
const entries = new Map<string, { promise: Promise<unknown>; expiresAt: number }>();

function pruneExpired(now: number): void {
  if (entries.size < 1000) return; // cheap: only bother sweeping once this could otherwise grow unbounded
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) entries.delete(key);
  }
}

/**
 * Runs `fn()` at most once per `key` within `ttlMs`. A call that
 * arrives while a prior call for the same key is still in flight (or
 * within the TTL after it settled) receives the SAME result — success
 * or failure — rather than re-executing side effects.
 */
export async function withIdempotency<T>(key: string, fn: () => Promise<T>, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  const now = Date.now();
  pruneExpired(now);

  const existing = entries.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise as Promise<T>;
  }

  const promise = fn();
  entries.set(key, { promise, expiresAt: now + ttlMs });

  try {
    return await promise;
  } catch (error) {
    // A failed attempt must not poison the key for its whole TTL — a
    // genuine transient failure (e.g. a DB hiccup) should be retryable
    // by the very next request with the same nonce, not silently
    // replay the same failure for two minutes.
    entries.delete(key);
    throw error;
  }
}
