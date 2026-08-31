/**
 * Stable internal error codes (Phase 9 §34) — logs and internal admin
 * surfaces use these; user-facing messages remain friendly/localized
 * and never expose a raw code or stack trace. Adding a new failure
 * mode should mean adding a code here, not inventing a fresh string
 * inline at the call site.
 */
export const ERROR_CODES = [
  "DB_UNAVAILABLE",
  "AUTH_INVALID",
  "AUTH_FORBIDDEN",
  "AI_PROVIDER_UNAVAILABLE",
  "AI_RATE_LIMITED",
  "ANALYTICS_PROVIDER_FAILED",
  "SEO_SYNC_FAILED",
  "LEAD_PERSISTENCE_FAILED",
  "VALIDATION_FAILED",
  "RATE_LIMITED",
  "NOT_FOUND",
  "UNEXPECTED",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
