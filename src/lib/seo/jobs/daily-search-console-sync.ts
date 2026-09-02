import { runSeoJob, type JobDispatchResult } from "./run-job";
import { syncSearchConsole } from "@/lib/seo/adapters/search-console";
import type { SeoJobTrigger } from "@/domain/seo-job";

/**
 * Calls the existing Search Console adapter — which, with no
 * credentials configured, honestly returns NOT_CONFIGURED and empty
 * metrics rather than a fabricated sync. NOT_CONFIGURED is a
 * legitimate SUCCEEDED outcome (the job correctly determined there is
 * nothing to sync yet); only a real ERROR/EXPIRED connection state
 * (credentials present but broken) marks the run PARTIAL, so a
 * genuine misconfiguration is visible without every single day's
 * routine "not connected yet" run looking like a failure.
 */
export async function runDailySearchConsoleSync(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("DAILY_SEARCH_CONSOLE_SYNC", triggeredBy, async () => {
    const { state, pageMetrics, queryMetrics } = await syncSearchConsole();
    const isDegraded = state.status === "ERROR" || state.status === "EXPIRED";
    return {
      counts: { pagesChecked: pageMetrics.length, opportunitiesFound: queryMetrics.length },
      sourceFreshness: { GOOGLE_SEARCH_CONSOLE: state.status },
      partial: isDegraded ? `Search Console: ${state.status}${state.lastError ? ` — ${state.lastError}` : ""}` : undefined,
    };
  });
}
