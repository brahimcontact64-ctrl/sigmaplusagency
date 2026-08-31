import { getSeoConnectionRepository } from "@/lib/repositories/seo-connection-repository";
import type { SeoConnectionState, PageSpeedMetric } from "@/domain/seo-intelligence";

/**
 * Future PageSpeed Insights adapter. FIELD (real-user CrUX) and LAB
 * (synthetic Lighthouse) data are never merged — see
 * `domain/seo-intelligence.ts`'s `PageSpeedDataKind`. Not blocked on
 * an API key this phase; reports NOT_CONFIGURED until
 * `PAGESPEED_API_KEY` exists and a real implementation calls the API.
 */
const PROVIDER = "PAGESPEED" as const;

export async function getPageSpeedConnection(): Promise<SeoConnectionState> {
  const repo = getSeoConnectionRepository();
  if (!process.env.PAGESPEED_API_KEY) {
    return repo.upsert(PROVIDER, { status: "NOT_CONFIGURED", lastError: undefined });
  }
  return repo.upsert(PROVIDER, { status: "ERROR", lastError: "API key configured but the PageSpeed Insights client is not yet implemented." });
}

export async function syncPageSpeed(): Promise<{ state: SeoConnectionState; metrics: PageSpeedMetric[] }> {
  const state = await getPageSpeedConnection();
  return { state, metrics: [] };
}
