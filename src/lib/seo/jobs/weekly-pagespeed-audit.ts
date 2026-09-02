import { runSeoJob, type JobDispatchResult } from "./run-job";
import { syncPageSpeed } from "@/lib/seo/adapters/pagespeed";
import { getTrackedPagePaths } from "./tracked-pages";
import type { SeoJobTrigger } from "@/domain/seo-job";

/** Same honesty policy as the daily sync jobs. `pages` is the real, current tracked-page list even while disconnected, so the adapter's real contract (once implemented) is exercised end-to-end today except for the actual HTTP call. */
export async function runWeeklyPageSpeedAudit(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("WEEKLY_PAGESPEED_AUDIT", triggeredBy, async () => {
    const pages = await getTrackedPagePaths();
    const { state, metrics } = await syncPageSpeed(pages);
    const isDegraded = state.status === "ERROR" || state.status === "EXPIRED";
    return {
      counts: { pagesChecked: pages.length, opportunitiesFound: metrics.length },
      sourceFreshness: { PAGESPEED: state.status },
      partial: isDegraded ? `PageSpeed: ${state.status}${state.lastError ? ` — ${state.lastError}` : ""}` : undefined,
    };
  });
}
