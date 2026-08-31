import { getDeploymentEnvironment } from "@/lib/deployment";

/**
 * Tags events with the deployment environment that generated them, at
 * write time — lets reporting exclude dev/preview/test traffic from
 * production numbers with zero bot-fingerprinting (Phase 9 §70).
 * Delegates to the one canonical environment detector (Phase 10 §8-9)
 * rather than re-deriving VERCEL_ENV/NODE_ENV logic here too.
 */
export function resolveAnalyticsEnvironment(): string {
  return getDeploymentEnvironment();
}

/**
 * The reporting/dashboard layer always reads this one fixed value,
 * regardless of which environment the Admin request itself is running
 * in — Admin opened from a preview deployment must never show preview
 * traffic as if it were real production numbers.
 */
export const PRODUCTION_ENVIRONMENT = "production";
