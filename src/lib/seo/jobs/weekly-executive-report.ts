import { runSeoJob, type JobDispatchResult } from "./run-job";
import { buildWeeklySeoReport } from "@/lib/seo/services/weekly-report";
import { sendSeoAlert } from "@/lib/notifications/seo-notification-service";
import { getAIProvider } from "@/lib/ai/get-provider";
import type { SeoJobTrigger } from "@/domain/seo-job";

/**
 * Builds the deterministic weekly report and persists it as this run's
 * `reportSnapshot` (Phase 12 §12) — /admin/seo reads the most recent
 * WEEKLY_EXECUTIVE_REPORT run to render it, so no separate reports
 * table was needed. The "report ready" notification is best-effort and
 * can never fail the job itself (Phase 12 §13).
 */
export async function runWeeklyExecutiveReport(triggeredBy: SeoJobTrigger): Promise<JobDispatchResult> {
  return runSeoJob("WEEKLY_EXECUTIVE_REPORT", triggeredBy, async () => {
    const report = await buildWeeklySeoReport(new Date(), getAIProvider());

    try {
      await sendSeoAlert("weekly_report_ready", [
        `Period: ${report.period.start.slice(0, 10)} to ${report.period.end.slice(0, 10)}`,
        `Recommendations awaiting approval: ${report.recommendationsAwaitingApproval}`,
        `Actions completed this period: ${report.actionsCompletedThisPeriod}`,
      ]);
    } catch (error) {
      // Never let a notification failure affect the report itself.
      console.error("[weekly-executive-report] notification dispatch failed (non-fatal):", error instanceof Error ? error.message : error);
    }

    return {
      counts: {
        opportunitiesFound: report.topOpportunities.length,
        recommendationsCreated: 0,
      },
      reportSnapshot: report,
    };
  });
}
