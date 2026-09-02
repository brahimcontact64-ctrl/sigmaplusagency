import { runSeoJob, type JobDispatchResult } from "./run-job";
import { syncSearchConsole } from "@/lib/seo/adapters/search-console";
import { detectContentDecay } from "@/lib/seo/opportunity-engine";
import { getSeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import type { SeoJobTrigger } from "@/domain/seo-job";

/**
 * `detectContentDecay` needs two EQUAL-LENGTH, non-overlapping periods
 * (Phase 8 §38) — a real implementation would call the adapter twice
 * with two distinct date ranges. `syncSearchConsole()` takes no date
 * range yet (there's nothing to range over while disconnected), so
 * this calls it once and lets the detector's own "either side empty
 * → []" guard produce the honest zero-opportunities result rather than
 * comparing a period against itself.
 */
export async function runWeeklyContentDecayAnalysis(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("WEEKLY_CONTENT_DECAY_ANALYSIS", triggeredBy, async () => {
    const { state, pageMetrics } = await syncSearchConsole();
    const opportunities = detectContentDecay(pageMetrics, pageMetrics.length > 0 ? pageMetrics : []);
    const { created, skippedDuplicate } = await getSeoRecommendationService().generateFromOpportunities(opportunities);

    const isDegraded = state.status === "ERROR" || state.status === "EXPIRED";
    return {
      counts: { opportunitiesFound: opportunities.length, recommendationsCreated: created, recommendationsSkippedDuplicate: skippedDuplicate },
      sourceFreshness: { GOOGLE_SEARCH_CONSOLE: state.status },
      partial: isDegraded ? `Search Console: ${state.status}${state.lastError ? ` — ${state.lastError}` : ""}` : undefined,
    };
  });
}
