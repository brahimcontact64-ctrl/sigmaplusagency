/**
 * Tags events with the deployment environment that generated them, at
 * write time — lets reporting exclude dev/preview/test traffic from
 * production numbers with zero bot-fingerprinting (Phase 9 §70).
 * Vercel sets VERCEL_ENV; anything else falls back to NODE_ENV.
 */
export function resolveAnalyticsEnvironment(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

/**
 * The reporting/dashboard layer always reads this one fixed value,
 * regardless of which environment the Admin request itself is running
 * in — Admin opened from a preview deployment must never show preview
 * traffic as if it were real production numbers.
 */
export const PRODUCTION_ENVIRONMENT = "production";
