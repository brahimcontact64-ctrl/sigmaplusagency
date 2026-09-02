import { runDailyTechnicalAudit } from "./daily-technical-audit";
import { runDailySearchConsoleSync } from "./daily-search-console-sync";
import { runDailyAnalyticsSync } from "./daily-analytics-sync";
import { runWeeklyPageSpeedAudit } from "./weekly-pagespeed-audit";
import { runWeeklyKeywordAnalysis } from "./weekly-keyword-analysis";
import { runWeeklySeoOpportunityAnalysis } from "./weekly-seo-opportunity-analysis";
import { runWeeklyContentDecayAnalysis } from "./weekly-content-decay-analysis";
import { runWeeklyExecutiveReport } from "./weekly-executive-report";
import type { SeoJobType, SeoJobTrigger } from "@/domain/seo-job";
import type { JobDispatchResult } from "./run-job";

export type { JobDispatchResult } from "./run-job";

/**
 * The single dispatch table both the cron endpoint
 * (/api/internal/seo/run) and the manual "Run now" admin action go
 * through — the only place that maps a job-type string to the
 * function that actually runs it. Adding a new job type means adding
 * one entry here, never a new call site elsewhere.
 */
export const SEO_JOB_DISPATCH: Record<SeoJobType, (triggeredBy: SeoJobTrigger) => Promise<JobDispatchResult>> = {
  DAILY_TECHNICAL_AUDIT: runDailyTechnicalAudit,
  DAILY_SEARCH_CONSOLE_SYNC: runDailySearchConsoleSync,
  DAILY_ANALYTICS_SYNC: runDailyAnalyticsSync,
  WEEKLY_PAGESPEED_AUDIT: runWeeklyPageSpeedAudit,
  WEEKLY_KEYWORD_ANALYSIS: runWeeklyKeywordAnalysis,
  WEEKLY_SEO_OPPORTUNITY_ANALYSIS: runWeeklySeoOpportunityAnalysis,
  WEEKLY_CONTENT_DECAY_ANALYSIS: runWeeklyContentDecayAnalysis,
  WEEKLY_EXECUTIVE_REPORT: runWeeklyExecutiveReport,
};
