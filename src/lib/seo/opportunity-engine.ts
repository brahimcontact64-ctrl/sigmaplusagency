import type { SeoIssue } from "@/domain/seo-issue";
import type { SeoOpportunity, SeoPageMetric, SeoQueryMetric, SeoDateRange } from "@/domain/seo-intelligence";
import type { NewSeoRecommendationInput } from "@/lib/repositories/seo-recommendation-repository";

/**
 * Deterministic opportunity rules (Phase 8 §36-39) — every function
 * here is pure and returns an empty array when it lacks enough data to
 * say anything meaningful, per the explicit "do not calculate
 * opportunities from missing data" instruction. None of these
 * functions call an external API themselves; they're fed whatever a
 * real sync (still not connected — see the adapters) would eventually
 * produce, and are unit-tested against synthetic data to prove the
 * logic works today even though live data doesn't exist yet.
 */

const MIN_IMPRESSIONS_FOR_CTR_OPPORTUNITY = 100;
const LOW_CTR_THRESHOLD = 0.02;
const MID_POSITION_RANGE: [number, number] = [5, 20];
const CANNIBALIZATION_MIN_SHARE = 0.25;
const CANNIBALIZATION_MIN_IMPRESSIONS = 50;

function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** High impressions, conspicuously low click-through — a real, common technical-SEO signal once GSC data exists. Never claims "CTR should be 10%" (Phase 8 §39) — flags relative underperformance only, with the raw numbers as evidence. */
export function detectHighImpressionsLowCtr(pageMetrics: SeoPageMetric[]): SeoOpportunity[] {
  const now = new Date().toISOString();
  return pageMetrics
    .filter((m) => m.impressions >= MIN_IMPRESSIONS_FOR_CTR_OPPORTUNITY && m.ctr < LOW_CTR_THRESHOLD)
    .map((m) => ({
      id: nextId("opp"),
      type: "HIGH_IMPRESSIONS_LOW_CTR" as const,
      page: m.page,
      locale: m.locale,
      confidence: Math.min(1, m.impressions / (MIN_IMPRESSIONS_FOR_CTR_OPPORTUNITY * 5)),
      evidence: `${m.impressions} impressions, ${(m.ctr * 100).toFixed(1)}% CTR (${m.clicks} clicks) over ${m.dateRange.start}–${m.dateRange.end}.`,
      dateRange: m.dateRange,
      source: m.source,
      generatedAt: now,
    }));
}

/** Positions 5-20 are the classic "close but not winning" band — worth a metadata/content pass, not evidence of anything broken. */
export function detectMidRankingPositions(pageMetrics: SeoPageMetric[]): SeoOpportunity[] {
  const now = new Date().toISOString();
  return pageMetrics
    .filter((m) => m.averagePosition >= MID_POSITION_RANGE[0] && m.averagePosition <= MID_POSITION_RANGE[1] && m.impressions > 0)
    .map((m) => ({
      id: nextId("opp"),
      type: "MID_RANKING_POSITION" as const,
      page: m.page,
      locale: m.locale,
      // Note: this is Search Console's *average position* metric, not a guaranteed rank — see docs/SEO_STRATEGY.md.
      confidence: 0.5,
      evidence: `Average position ${m.averagePosition.toFixed(1)} over ${m.dateRange.start}–${m.dateRange.end}.`,
      dateRange: m.dateRange,
      source: m.source,
      generatedAt: now,
    }));
}

/**
 * A query materially split across multiple pages — only flagged above
 * a real evidentiary bar (both a minimum impression volume AND no
 * single page holding a dominant share). Normal, healthy multi-page
 * visibility for a broad query is NOT cannibalization — see Phase 8
 * §37's explicit warning against false positives.
 */
export function detectCannibalization(queryMetrics: SeoQueryMetric[]): SeoOpportunity[] {
  const now = new Date().toISOString();
  const byQuery = new Map<string, SeoQueryMetric[]>();
  for (const m of queryMetrics) {
    byQuery.set(m.query, [...(byQuery.get(m.query) ?? []), m]);
  }

  const opportunities: SeoOpportunity[] = [];
  for (const [query, rows] of byQuery) {
    if (rows.length < 2) continue;
    const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
    if (totalImpressions < CANNIBALIZATION_MIN_IMPRESSIONS) continue;

    const shares = rows.map((r) => r.impressions / totalImpressions).sort((a, b) => b - a);
    const dominantShare = shares[0]!;
    const runnerUpShare = shares[1] ?? 0;
    // Evidence of real competition between pages: no single page dominates, and the runner-up has a meaningful share too.
    if (dominantShare < 1 - CANNIBALIZATION_MIN_SHARE && runnerUpShare >= CANNIBALIZATION_MIN_SHARE) {
      const [primary] = rows;
      opportunities.push({
        id: nextId("opp"),
        type: "CANNIBALIZATION",
        page: rows.map((r) => r.page).join(", "),
        confidence: Math.min(1, runnerUpShare / CANNIBALIZATION_MIN_SHARE - 1 + 0.5),
        evidence: `Query "${query}" splits ${totalImpressions} impressions across ${rows.length} pages with no single dominant page (top share ${(dominantShare * 100).toFixed(0)}%).`,
        dateRange: primary!.dateRange,
        source: primary!.source,
        generatedAt: now,
      });
    }
  }
  return opportunities;
}

function rangeLengthDays(range: SeoDateRange): number {
  return Math.round((new Date(range.end).getTime() - new Date(range.start).getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Content decay: compares two periods of *equal length* only (Phase 8
 * §38 explicitly forbids e.g. "7 days vs 90 days") and flags a real,
 * material click decline. Returns [] rather than a misleading result
 * when the ranges aren't comparable or a page is missing from either side.
 */
export function detectContentDecay(current: SeoPageMetric[], previous: SeoPageMetric[]): SeoOpportunity[] {
  if (current.length === 0 || previous.length === 0) return [];
  const now = new Date().toISOString();
  const results: SeoOpportunity[] = [];
  const previousByPage = new Map(previous.map((m) => [`${m.locale ?? ""}::${m.page}`, m]));

  for (const curr of current) {
    if (rangeLengthDays(curr.dateRange) !== rangeLengthDays(previous[0]!.dateRange)) continue; // ranges must be comparable in length
    const prev = previousByPage.get(`${curr.locale ?? ""}::${curr.page}`);
    if (!prev) continue;
    if (prev.clicks === 0) continue; // avoid a meaningless "infinite decline" from a zero baseline

    const change = (curr.clicks - prev.clicks) / prev.clicks;
    if (change <= -0.3) {
      results.push({
        id: nextId("opp"),
        type: "DECLINING_CLICKS",
        page: curr.page,
        locale: curr.locale,
        confidence: Math.min(1, Math.abs(change)),
        evidence: `Clicks fell ${(Math.abs(change) * 100).toFixed(0)}% (${prev.clicks} → ${curr.clicks}) comparing ${previous[0]!.dateRange.start}–${previous[0]!.dateRange.end} to ${curr.dateRange.start}–${curr.dateRange.end}.`,
        dateRange: curr.dateRange,
        source: curr.source,
        generatedAt: now,
      });
    }
  }
  return results;
}

/**
 * The one rule that runs today with zero external connections: turns
 * existing Phase 7 audit findings (WARNING/OPPORTUNITY only — an ERROR
 * is a bug to fix directly, not a strategic "recommendation") into
 * draft SEO recommendations. This is what actually populates
 * `/admin/seo`'s Opportunities tab right now.
 */
export function recommendationsFromAuditIssues(issues: SeoIssue[]): NewSeoRecommendationInput[] {
  return issues
    .filter((i) => i.type !== "ERROR")
    .map((issue) => ({
      type: `audit:${issue.message.split(" ")[0]?.toLowerCase() ?? "finding"}`,
      severity: issue.type === "WARNING" ? ("MEDIUM" as const) : ("LOW" as const),
      page: issue.page,
      locale: issue.locale,
      reason: issue.message,
      recommendedAction: issue.recommendation,
      source: issue.source,
      confidence: issue.type === "WARNING" ? 0.7 : 0.4,
    }));
}

const OPPORTUNITY_RECOMMENDED_ACTION: Record<SeoOpportunity["type"], string> = {
  HIGH_IMPRESSIONS_LOW_CTR: "Improve this page's title/meta description to lift click-through — the ranking is already earning impressions.",
  MID_RANKING_POSITION: "Strengthen this page's content/internal links to push it out of the 'close but not winning' band.",
  DECLINING_CLICKS: "Investigate the click decline — check for a ranking drop, a content-freshness issue, or a SERP feature change.",
  WEAK_METADATA_WITH_IMPRESSIONS: "Rewrite this page's title/meta description — it's already earning visibility despite weak metadata.",
  CANNIBALIZATION: "Consolidate or differentiate these pages so one clear page targets this query.",
  HIGH_TRAFFIC_LOW_CONVERSION: "Review this landing page's conversion path — traffic exists but isn't converting.",
  PERFORMANCE_REGRESSION: "Investigate the Core Web Vitals regression on this page.",
};

/**
 * Turns detected opportunities (from the detect* functions above, once
 * real GSC/PageSpeed data exists) into draft recommendations — same
 * approval-first, dedup-on-create pipeline as
 * `recommendationsFromAuditIssues`, just for a different upstream
 * source. `severity` is derived from confidence rather than invented
 * per type, since an opportunity's own confidence already reflects how
 * strong its evidence is.
 */
export function recommendationsFromOpportunities(opportunities: SeoOpportunity[]): NewSeoRecommendationInput[] {
  return opportunities.map((opp) => ({
    type: `opportunity:${opp.type.toLowerCase()}`,
    severity: opp.confidence >= 0.7 ? ("HIGH" as const) : opp.confidence >= 0.4 ? ("MEDIUM" as const) : ("LOW" as const),
    page: opp.page,
    locale: opp.locale,
    reason: opp.evidence,
    recommendedAction: OPPORTUNITY_RECOMMENDED_ACTION[opp.type],
    source: opp.source,
    confidence: opp.confidence,
  }));
}
