/**
 * Centralized deployment-environment detection (Phase 10 §8-9) — the
 * one place that decides "is this actually production," so a preview
 * deployment never accidentally identifies itself as production
 * (indexable robots.txt, indexable page metadata) just because
 * `NODE_ENV=production` is also true during a preview build.
 *
 * Vercel sets `VERCEL_ENV` to `"production"` / `"preview"` /
 * `"development"` — that's authoritative when present. Outside Vercel
 * (or before it's set, e.g. a plain `next build && next start` on a
 * self-hosted box), `NODE_ENV` is the only signal available, and a
 * production build there is genuinely production.
 *
 * `src/lib/analytics/environment.ts`'s `resolveAnalyticsEnvironment()`
 * delegates to this for consistency — one source of truth for "which
 * environment is this," not two slightly-different ones.
 */
export type DeploymentEnvironment = "production" | "preview" | "development";

export function getDeploymentEnvironment(): DeploymentEnvironment {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production" || vercelEnv === "preview") return vercelEnv;
  if (vercelEnv === "development") return "development";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** True only for a real production deployment — never true for a preview, even though a preview build also runs with `NODE_ENV=production`. */
export function isProductionDeployment(): boolean {
  return getDeploymentEnvironment() === "production";
}
