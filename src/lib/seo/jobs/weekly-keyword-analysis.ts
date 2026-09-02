import { runSeoJob, type JobDispatchResult } from "./run-job";
import { getKeywordProvider, getKeywordProviderConnection } from "@/lib/seo/providers/keyword-provider";
import { KEYWORD_HYPOTHESES } from "@/config/keyword-hypotheses";
import type { SeoJobTrigger } from "@/domain/seo-job";

/**
 * Checks the documented Algeria keyword hypotheses (§13) against
 * whatever SERP provider is configured — today, none, so this
 * honestly reports NOT_CONFIGURED and zero checks rather than
 * fabricating a position. No doorway/location page is ever created by
 * this job; it only ever produces data for a human to review.
 */
export async function runWeeklyKeywordAnalysis(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("WEEKLY_KEYWORD_ANALYSIS", triggeredBy, async () => {
    const connection = await getKeywordProviderConnection();
    const provider = getKeywordProvider();
    const results = provider.isConfigured() ? await provider.checkPositions(KEYWORD_HYPOTHESES) : [];
    const isDegraded = connection.status === "ERROR" || connection.status === "EXPIRED";
    return {
      counts: { pagesChecked: KEYWORD_HYPOTHESES.length, opportunitiesFound: results.length },
      sourceFreshness: { SERP: connection.status },
      partial: isDegraded ? `SERP provider: ${connection.status}${connection.lastError ? ` — ${connection.lastError}` : ""}` : undefined,
    };
  });
}
