import { getSeoConnectionRepository } from "@/lib/repositories/seo-connection-repository";
import { getSeoJobRepository } from "@/lib/repositories/seo-job-repository";
import { getSeoRecommendationRepository } from "@/lib/repositories/seo-recommendation-repository";
import { getGrowthAnalyticsService } from "@/lib/services/growth-analytics-service";
import type { AIProvider } from "@/lib/ai/provider";
import type { SeoConnectionState } from "@/domain/seo-intelligence";
import type { SeoJobRun } from "@/domain/seo-job";
import type { SeoRecommendation } from "@/domain/seo-intelligence";

export type WeeklyMetricChange = { label: string; current: number; previous: number; deltaPct: number | null };

export type WeeklySeoReport = {
  generatedAt: string;
  period: { start: string; end: string };
  previousPeriod: { start: string; end: string };
  connections: SeoConnectionState[];
  metrics: WeeklyMetricChange[];
  recommendationsAwaitingApproval: number;
  actionsCompletedThisPeriod: number;
  topOpportunities: Pick<SeoRecommendation, "id" | "type" | "page" | "locale" | "reason" | "confidence" | "source">[];
  recentJobRuns: Pick<SeoJobRun, "jobType" | "status" | "startedAt" | "completedAt">[];
  /** Only present when SIGMA AI is configured — a plain-language gloss over the metrics above, never a source of any number itself. */
  aiSummary?: string;
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // "infinite" growth from a zero baseline isn't a meaningful percentage
  return ((current - previous) / previous) * 100;
}

function metric(label: string, current: number, previous: number): WeeklyMetricChange {
  return { label, current, previous, deltaPct: pctChange(current, previous) };
}

/**
 * Deterministic weekly SEO/growth report (Phase 12 §12) — every number
 * comes from a real, already-tested data source (first-party analytics
 * via GrowthAnalyticsService, the SEO connection/recommendation/job
 * repositories). No external GSC/GA4/PageSpeed number is fabricated:
 * when those providers aren't connected, `connections` honestly shows
 * that, and the report simply has nothing further to say about them —
 * it never substitutes an estimate.
 *
 * `aiProvider` is injected rather than resolved internally (same
 * pattern as AiConversationService) specifically so this module never
 * imports @/lib/ai/get-provider.ts, which pulls in `server-only` and
 * can't be imported outside the real Next.js runtime — keeping this
 * function directly unit-testable. Pass `null` (the default) to skip
 * AI summarization entirely; the caller (the WEEKLY_EXECUTIVE_REPORT
 * job) passes the real provider when one is configured.
 */
export async function buildWeeklySeoReport(now: Date = new Date(), aiProvider: AIProvider | null = null): Promise<WeeklySeoReport> {
  const periodEnd = now;
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousPeriodEnd = periodStart;
  const previousPeriodStart = new Date(previousPeriodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const period = { start: periodStart.toISOString(), end: periodEnd.toISOString() };
  const previousPeriod = { start: previousPeriodStart.toISOString(), end: previousPeriodEnd.toISOString() };

  const growth = getGrowthAnalyticsService();
  const [connections, currentOverview, previousOverview, currentAcquisition, previousAcquisition, recommended, recentJobRuns, approvedRows, publishedRows, rejectedRows] =
    await Promise.all([
      getSeoConnectionRepository().listAll(),
      growth.getOverview({ start: periodStart, end: periodEnd }),
      growth.getOverview({ start: previousPeriodStart, end: previousPeriodEnd }),
      growth.getAcquisitionBreakdown({ start: periodStart, end: periodEnd }),
      growth.getAcquisitionBreakdown({ start: previousPeriodStart, end: previousPeriodEnd }),
      getSeoRecommendationRepository().list({ status: "RECOMMENDED" }),
      getSeoJobRepository().history(undefined, 15),
      getSeoRecommendationRepository().list({ status: "APPROVED" }),
      getSeoRecommendationRepository().list({ status: "PUBLISHED" }),
      getSeoRecommendationRepository().list({ status: "REJECTED" }),
    ]);

  const organicLeadsCurrent = currentAcquisition.find((r) => r.channel === "organic_search")?.leadCount ?? 0;
  const organicLeadsPrevious = previousAcquisition.find((r) => r.channel === "organic_search")?.leadCount ?? 0;

  const metrics: WeeklyMetricChange[] = [
    metric("Sessions", currentOverview.sessions, previousOverview.sessions),
    metric("Leads created", currentOverview.leadsCreated, previousOverview.leadsCreated),
    metric("Organic-search leads", organicLeadsCurrent, organicLeadsPrevious),
    metric("Proposals requested", currentOverview.proposalCount, previousOverview.proposalCount),
    metric("WhatsApp handoffs", currentOverview.whatsappHandoffs, previousOverview.whatsappHandoffs),
    metric("AI-assisted sessions", currentOverview.aiAssistedSessions, previousOverview.aiAssistedSessions),
    metric("Deals won", currentOverview.wonCount, previousOverview.wonCount),
  ];

  const actionsCompletedThisPeriod = [...approvedRows, ...publishedRows, ...rejectedRows].filter((r) => {
    if (!r.reviewedAt) return false;
    const reviewedAt = new Date(r.reviewedAt).getTime();
    return reviewedAt >= periodStart.getTime() && reviewedAt <= periodEnd.getTime();
  }).length;

  const topOpportunities = [...recommended]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((r) => ({ id: r.id, type: r.type, page: r.page, locale: r.locale, reason: r.reason, confidence: r.confidence, source: r.source }));

  const report: WeeklySeoReport = {
    generatedAt: now.toISOString(),
    period,
    previousPeriod,
    connections,
    metrics,
    recommendationsAwaitingApproval: recommended.length,
    actionsCompletedThisPeriod,
    topOpportunities,
    recentJobRuns: recentJobRuns.map((r) => ({ jobType: r.jobType, status: r.status, startedAt: r.startedAt, completedAt: r.completedAt })),
  };

  const aiSummary = await tryGenerateAiSummary(report, aiProvider);
  return aiSummary ? { ...report, aiSummary } : report;
}

/**
 * AI never computes or invents a metric — it only ever receives
 * numbers this module already computed and is instructed to explain
 * them in plain language. Returns `undefined` (never a placeholder
 * string) when no provider was supplied, matching this codebase's
 * standing "honest unavailable state" policy for the AI provider.
 */
async function tryGenerateAiSummary(report: WeeklySeoReport, provider: AIProvider | null): Promise<string | undefined> {
  if (!provider) return undefined;

  const system =
    "You are summarizing a weekly SEO/growth report for a digital agency's OWNER. " +
    "You are given only real, already-computed metrics — never invent a number, ranking, " +
    "competitor, or connection status not present in the data below. If a metric is missing " +
    "or a provider is not connected, say so plainly rather than guessing. Keep it to 4-6 short " +
    "sentences, plain language, no marketing tone.";
  const message = JSON.stringify({
    period: report.period,
    connections: report.connections.map((c) => ({ provider: c.provider, status: c.status })),
    metrics: report.metrics,
    recommendationsAwaitingApproval: report.recommendationsAwaitingApproval,
    actionsCompletedThisPeriod: report.actionsCompletedThisPeriod,
    topOpportunityCount: report.topOpportunities.length,
  });

  try {
    return await provider.complete({ system, messages: [{ role: "user", content: message }], maxTokens: 400 });
  } catch (error) {
    console.error("[weekly-seo-report] AI summary generation failed (non-fatal):", error instanceof Error ? error.message : error);
    return undefined;
  }
}
