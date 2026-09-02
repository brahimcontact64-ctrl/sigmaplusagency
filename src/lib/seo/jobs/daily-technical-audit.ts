import { runSeoJob, type JobDispatchResult } from "./run-job";
import { runSeoAudit } from "@/lib/seo/audit";
import { getSeoRecommendationService } from "@/lib/services/seo-recommendation-service";
import type { SeoJobTrigger } from "@/domain/seo-job";

/**
 * The one job that runs fully today with zero external connections —
 * the deterministic technical audit (Phase 7) feeding the approval-
 * first recommendation queue (Phase 8), now deduplicated across runs
 * (Phase 12 — see seo-recommendation-service.ts's generateFromAudit).
 */
export async function runDailyTechnicalAudit(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("DAILY_TECHNICAL_AUDIT", triggeredBy, async () => {
    const issues = await runSeoAudit();
    const { created, skippedDuplicate } = await getSeoRecommendationService().generateFromAudit(issues);
    return {
      counts: {
        issuesFound: issues.length,
        recommendationsCreated: created,
        recommendationsSkippedDuplicate: skippedDuplicate,
      },
    };
  });
}
