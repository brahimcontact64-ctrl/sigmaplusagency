import { runSeoJob, type JobDispatchResult } from "./run-job";
import { syncAnalyticsReporting } from "@/lib/seo/adapters/analytics-reporting";
import type { SeoJobTrigger } from "@/domain/seo-job";

/** Same honesty policy as the Search Console sync job — see its doc comment. */
export async function runDailyAnalyticsSync(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("DAILY_ANALYTICS_SYNC", triggeredBy, async () => {
    const { state, pageMetrics } = await syncAnalyticsReporting();
    const isDegraded = state.status === "ERROR" || state.status === "EXPIRED";
    return {
      counts: { pagesChecked: pageMetrics.length },
      sourceFreshness: { GOOGLE_ANALYTICS: state.status },
      partial: isDegraded ? `GA4 reporting: ${state.status}${state.lastError ? ` — ${state.lastError}` : ""}` : undefined,
    };
  });
}
