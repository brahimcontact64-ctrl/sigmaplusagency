import { runSeoJob, type JobDispatchResult } from "./run-job";
import { syncSearchConsole } from "@/lib/seo/adapters/search-console";
import { detectHighImpressionsLowCtr, detectMidRankingPositions, detectCannibalization } from "@/lib/seo/opportunity-engine";
import { getSeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import type { SeoJobTrigger } from "@/domain/seo-job";

/**
 * Runs the GSC-dependent deterministic opportunity rules (Phase 8 §36-
 * 39) against whatever `syncSearchConsole()` currently returns — `[]`
 * today, so this honestly produces zero opportunities rather than
 * inventing any; the rules themselves are already implemented and
 * unit-tested against synthetic data (see opportunity-engine.test.ts),
 * waiting only for real input once Search Console is connected.
 */
export async function runWeeklySeoOpportunityAnalysis(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("WEEKLY_SEO_OPPORTUNITY_ANALYSIS", triggeredBy, async () => {
    const { state, pageMetrics, queryMetrics } = await syncSearchConsole();

    const opportunities = [
      ...detectHighImpressionsLowCtr(pageMetrics),
      ...detectMidRankingPositions(pageMetrics),
      ...detectCannibalization(queryMetrics),
    ];
    const { created, skippedDuplicate } = await getSeoRecommendationService().generateFromOpportunities(opportunities);

    const isDegraded = state.status === "ERROR" || state.status === "EXPIRED";
    return {
      counts: { opportunitiesFound: opportunities.length, recommendationsCreated: created, recommendationsSkippedDuplicate: skippedDuplicate },
      sourceFreshness: { GOOGLE_SEARCH_CONSOLE: state.status },
      partial: isDegraded ? `Search Console: ${state.status}${state.lastError ? ` — ${state.lastError}` : ""}` : undefined,
    };
  });
}
