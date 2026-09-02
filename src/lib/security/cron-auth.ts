import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time bearer-token check for the internal SEO cron endpoint
 * (Phase 12 §3) — same `timingSafeEqual` primitive already used for
 * password verification (src/lib/auth/password.ts), just compared as
 * plain UTF-8 bytes instead of a scrypt digest (a static shared secret
 * needs no hashing, only a non-timing-leaky comparison).
 *
 * Fails closed: a missing `CRON_SECRET` means every request is
 * rejected, never "any secret works" or "auth is skipped."
 */
export function isValidCronAuthorization(authorizationHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorizationHeader) return false;

  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const provided = Buffer.from(authorizationHeader, "utf8");
  // timingSafeEqual throws on mismatched lengths — checking first is
  // itself technically a length-based timing signal, but leaking a
  // secret's *length* (never its content) is an accepted, standard
  // trade-off for this primitive.
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}
