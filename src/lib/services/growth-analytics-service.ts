import { getAnalyticsRepository, type AnalyticsRepository } from "@/lib/repositories/analytics-repository";
import { getCrmRepository, type CrmRepository } from "@/lib/repositories/crm-repository";
import { safeRate, type DateRange } from "@/lib/analytics/rates";
import { PRODUCTION_ENVIRONMENT } from "@/lib/analytics/environment";
import { classifyChannel, type Channel } from "@/lib/attribution/channel";
import type { AnalyticsEventName } from "@/domain/analytics-event";

export type OverviewMetrics = {
  sessions: number;
  leadsCreated: number;
  qualifiedCount: number;
  proposalCount: number;
  wonCount: number;
  conversionRate: number | null; // leadsCreated / sessions
  whatsappHandoffs: number;
  aiAssistedSessions: number;
};

export type FunnelStage = { event: AnalyticsEventName; label: string; sessionCount: number; conversionFromPrevious: number | null };

/**
 * Lead-level acquisition only — NOT a session-level breakdown.
 * `page_view` doesn't currently carry UTM/source dimensions (see
 * `page-view-tracker.tsx`), so there is no real session-level channel
 * data to report yet; adding one would mean guessing. This reports
 * exactly what's real: which channel each CRM lead's First Touch was
 * attributed to. Documented as a known limitation in
 * docs/ANALYTICS_MEASUREMENT_PLAN.md rather than backfilled with a
 * fabricated session count.
 */
export type AcquisitionRow = { channel: Channel; leadCount: number };

export type ContentBreakdownRow = { id: string; views: number; ctaClicks: number; builderStarts: number; attributedLeads: number };

/**
 * Real conversion/funnel query layer for the Admin Analytics/Growth
 * dashboard (Phase 9 §11-16, §21-27). Every number here is a real
 * count derived from `analytics_events`/`leads` in the given range —
 * never a fabricated or estimated figure. Zero data returns zero
 * counts and `null` rates (rendered as an honest "—" in the UI), never
 * an invented percentage. All correlation claims (AI-assisted vs. not)
 * are exactly that — correlation, not causation; see
 * docs/ANALYTICS_MEASUREMENT_PLAN.md.
 */
export class GrowthAnalyticsService {
  constructor(
    private readonly analytics: AnalyticsRepository = getAnalyticsRepository(),
    private readonly crm: CrmRepository = getCrmRepository(),
  ) {}

  async getOverview(range: DateRange): Promise<OverviewMetrics> {
    const env = PRODUCTION_ENVIRONMENT;
    const [sessions, whatsappHandoffs, aiAssistedSessions, snapshot] = await Promise.all([
      this.analytics.countDistinctSessions(range, env),
      this.analytics.countSessionsWithEvent("whatsapp_handoff_clicked", range, env),
      this.analytics.countSessionsWithEvent("ai_consultation_started", range, env),
      this.crm.getConversionSnapshot(range),
    ]);

    const qualifiedCount = snapshot.statusCounts.find((r) => r.status === "QUALIFIED")?.count ?? 0;
    const proposalCount = snapshot.statusCounts.find((r) => r.status === "PROPOSAL")?.count ?? 0;

    return {
      sessions,
      leadsCreated: snapshot.leadsCreated,
      qualifiedCount,
      proposalCount,
      wonCount: snapshot.wonCount,
      conversionRate: safeRate(snapshot.leadsCreated, sessions),
      whatsappHandoffs,
      aiAssistedSessions,
    };
  }

  /**
   * Project Builder funnel (Phase 9 §11-12). Abandonment is a
   * deterministic, documented rule — NOT a "hasn't finished within N
   * seconds" heuristic: a session counts as abandoned only when it
   * fired `project_builder_started` without `project_builder_completed`
   * AND the browser actually navigated away/closed mid-flow (captured
   * via a `beforeunload` listener in `project-builder.tsx`, which fires
   * `project_builder_abandoned` at that exact moment). A session that
   * simply hasn't finished yet (still on the page) is not abandoned.
   */
  async getProjectBuilderFunnel(range: DateRange): Promise<FunnelStage[]> {
    const env = PRODUCTION_ENVIRONMENT;
    const stages: { event: AnalyticsEventName; label: string }[] = [
      { event: "project_builder_viewed", label: "Viewed" },
      { event: "project_builder_started", label: "Started" },
      { event: "project_builder_completed", label: "Completed" },
    ];
    const counts = await Promise.all(stages.map((s) => this.analytics.countSessionsWithEvent(s.event, range, env)));
    const [leadsFromBuilder, abandoned] = await Promise.all([
      this.analytics.countSessionsWithEventProperty("lead_created", "source", "project_builder", range, env),
      this.analytics.countSessionsWithEvent("project_builder_abandoned", range, env),
    ]);

    const result: FunnelStage[] = stages.map((s, i) => ({
      event: s.event,
      label: s.label,
      sessionCount: counts[i]!,
      conversionFromPrevious: i === 0 ? null : safeRate(counts[i]!, counts[i - 1]!),
    }));
    result.push({ event: "lead_created", label: "Lead created", sessionCount: leadsFromBuilder, conversionFromPrevious: safeRate(leadsFromBuilder, counts[counts.length - 1]!) });
    result.push({ event: "project_builder_abandoned", label: "Abandoned (started, never completed)", sessionCount: abandoned, conversionFromPrevious: safeRate(abandoned, counts[1]!) });
    return result;
  }

  /** AI Consultant funnel (Phase 9 §13). */
  async getAiConsultantFunnel(range: DateRange): Promise<FunnelStage[]> {
    const env = PRODUCTION_ENVIRONMENT;
    const stages: { event: AnalyticsEventName; label: string }[] = [
      { event: "ai_consultant_viewed", label: "Viewed" },
      { event: "ai_consultation_started", label: "Started" },
      { event: "ai_qualification_updated", label: "Qualification progressed" },
      { event: "ai_builder_handoff", label: "Builder handoff" },
      { event: "ai_contact_requested", label: "Contact requested" },
    ];
    const counts = await Promise.all(stages.map((s) => this.analytics.countSessionsWithEvent(s.event, range, env)));
    const leadsFromAi = await this.analytics.countSessionsWithEventProperty("lead_created", "source", "ai_consultant", range, env);

    const result: FunnelStage[] = stages.map((s, i) => ({
      event: s.event,
      label: s.label,
      sessionCount: counts[i]!,
      conversionFromPrevious: i === 0 ? null : safeRate(counts[i]!, counts[i - 1]!),
    }));
    result.push({ event: "lead_created", label: "Lead created", sessionCount: leadsFromAi, conversionFromPrevious: safeRate(leadsFromAi, counts[counts.length - 1]!) });
    return result;
  }

  /**
   * AI-assisted vs. non-AI conversion — CORRELATION ONLY (Phase 9
   * §13). This is an observed association between using SIGMA AI and
   * later becoming a lead within the same session; it is NOT a
   * controlled experiment (no randomized assignment, no control for
   * who chooses to use AI in the first place), so it must never be
   * reported as AI *causing* a conversion lift. See
   * docs/ANALYTICS_MEASUREMENT_PLAN.md's explicit caveat.
   */
  async getAiAssistedComparison(range: DateRange): Promise<{ aiAssistedSessions: number; aiAssistedConvertedSessions: number; aiAssistedRate: number | null; otherSessions: number; otherConvertedSessions: number; otherRate: number | null }> {
    const env = PRODUCTION_ENVIRONMENT;
    const [totalSessions, aiSessions, aiConverted, totalConverted] = await Promise.all([
      this.analytics.countDistinctSessions(range, env),
      this.analytics.countSessionsWithEvent("ai_consultation_started", range, env),
      this.analytics.countSessionsWithAllEvents(["ai_consultation_started", "lead_created"], range, env),
      this.analytics.countSessionsWithEvent("lead_created", range, env),
    ]);

    const otherSessions = Math.max(totalSessions - aiSessions, 0);
    const otherConverted = Math.max(totalConverted - aiConverted, 0);

    return {
      aiAssistedSessions: aiSessions,
      aiAssistedConvertedSessions: aiConverted,
      aiAssistedRate: safeRate(aiConverted, aiSessions),
      otherSessions,
      otherConvertedSessions: otherConverted,
      otherRate: safeRate(otherConverted, otherSessions),
    };
  }

  /** Per-service conversion intelligence (Phase 9 §14) — views/CTA clicks/builder starts/attributed leads, session-attribution based, never forced. */
  async getServiceBreakdown(range: DateRange): Promise<ContentBreakdownRow[]> {
    return this.getContentBreakdown("service_viewed", "serviceId", range);
  }

  /** Per-case-study conversion intelligence (Phase 9 §15). */
  async getCaseStudyBreakdown(range: DateRange): Promise<ContentBreakdownRow[]> {
    return this.getContentBreakdown("case_study_viewed", "caseStudyId", range);
  }

  /** Per-article conversion intelligence (Phase 9 §16). */
  async getArticleBreakdown(range: DateRange): Promise<ContentBreakdownRow[]> {
    return this.getContentBreakdown("article_viewed", "articleId", range);
  }

  private async getContentBreakdown(viewEvent: AnalyticsEventName, propertyKey: string, range: DateRange): Promise<ContentBreakdownRow[]> {
    const env = PRODUCTION_ENVIRONMENT;
    const [views, ctaClicks] = await Promise.all([
      this.analytics.groupDistinctSessionsByProperty(viewEvent, propertyKey, range, env),
      this.analytics.groupDistinctSessionsByProperty("cta_click", propertyKey, range, env),
    ]);
    const ctaById = new Map(ctaClicks.map((r) => [r.value, r.sessionCount]));

    return views.map((v) => ({
      id: v.value,
      views: v.sessionCount,
      ctaClicks: ctaById.get(v.value) ?? 0,
      builderStarts: 0, // Not independently attributable per content id without forcing a funnel path — deliberately left at 0 rather than guessed; see measurement plan.
      attributedLeads: v.leadAttributedSessionCount,
    }));
  }

  /** Acquisition breakdown by channel (Phase 9 §23) — grouped via the documented First-Touch + single-touch channel heuristic in `classifyChannel`. */
  async getAcquisitionBreakdown(range: DateRange): Promise<AcquisitionRow[]> {
    const snapshot = await this.crm.getConversionSnapshot(range);
    const byChannel = new Map<Channel, number>();

    for (const row of snapshot.attributionRows) {
      const channel = classifyChannel(row);
      byChannel.set(channel, (byChannel.get(channel) ?? 0) + row.count);
    }

    return Array.from(byChannel.entries()).map(([channel, leadCount]) => ({ channel, leadCount }));
  }

  /** CRM stage-conversion reporting (Phase 9 §17). Never computes revenue — see money.ts / deal-value fields for the manual-only figures that exist instead. */
  async getCrmConversion(range: DateRange): Promise<{ leadsCreated: number; qualifiedCount: number; proposalCount: number; wonCount: number; lostCount: number; leadToQualifiedRate: number | null; qualifiedToWonRate: number | null }> {
    const snapshot = await this.crm.getConversionSnapshot(range);
    const qualifiedCount = snapshot.statusCounts.find((r) => r.status === "QUALIFIED")?.count ?? 0;
    const proposalCount = snapshot.statusCounts.find((r) => r.status === "PROPOSAL")?.count ?? 0;

    return {
      leadsCreated: snapshot.leadsCreated,
      qualifiedCount,
      proposalCount,
      wonCount: snapshot.wonCount,
      lostCount: snapshot.lostCount,
      leadToQualifiedRate: safeRate(qualifiedCount, snapshot.leadsCreated),
      qualifiedToWonRate: safeRate(snapshot.wonCount, qualifiedCount),
    };
  }

  /** Freshness indicator for the dashboard (Phase 9 §27) — the actual timestamp of the most recent recorded event, so the UI can say "as of ..." rather than implying real-time data. */
  async getDataFreshness(): Promise<Date | null> {
    return this.analytics.latestEventAt();
  }
}

let service: GrowthAnalyticsService | null = null;

export function getGrowthAnalyticsService(): GrowthAnalyticsService {
  if (!service) service = new GrowthAnalyticsService();
  return service;
}

export function createTestGrowthAnalyticsService(analytics: AnalyticsRepository, crm: CrmRepository): GrowthAnalyticsService {
  return new GrowthAnalyticsService(analytics, crm);
}
