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

/**
 * `pages` documents which pages the job layer wants tracked (Phase 12
 * §6 — homepage, major services, start-project, contact, key case
 * studies, top-performing articles; see
 * src/lib/seo/jobs/tracked-pages.ts) — unused while disconnected, but
 * part of this function's real contract so a future implementation
 * doesn't need a signature change to receive it.
 */
export async function syncPageSpeed(pages: string[] = []): Promise<{ state: SeoConnectionState; metrics: PageSpeedMetric[] }> {
  void pages;
  const state = await getPageSpeedConnection();
  return { state, metrics: [] };
}
