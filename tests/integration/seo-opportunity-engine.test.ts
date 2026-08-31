import { describe, it, expect } from "vitest";
import {
  detectHighImpressionsLowCtr,
  detectMidRankingPositions,
  detectCannibalization,
  detectContentDecay,
  recommendationsFromAuditIssues,
} from "@/lib/seo/opportunity-engine";
import type { SeoPageMetric, SeoQueryMetric } from "@/domain/seo-intelligence";
import type { SeoIssue } from "@/domain/seo-issue";

const range = { start: "2026-08-01", end: "2026-08-31" };

function pageMetric(overrides: Partial<SeoPageMetric> = {}): SeoPageMetric {
  return { page: "/en/services/web-development", clicks: 5, impressions: 500, ctr: 0.01, averagePosition: 12, dateRange: range, source: "GOOGLE_SEARCH_CONSOLE", ...overrides };
}

describe("opportunity engine — never calculates from missing data", () => {
  it("returns [] for every detector given an empty input", () => {
    expect(detectHighImpressionsLowCtr([])).toEqual([]);
    expect(detectMidRankingPositions([])).toEqual([]);
    expect(detectCannibalization([])).toEqual([]);
    expect(detectContentDecay([], [])).toEqual([]);
  });
});

describe("detectHighImpressionsLowCtr", () => {
  it("flags high impressions with a conspicuously low CTR", () => {
    const result = detectHighImpressionsLowCtr([pageMetric({ impressions: 1000, ctr: 0.01 })]);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("HIGH_IMPRESSIONS_LOW_CTR");
  });

  it("does not flag low impressions even with low CTR (not enough evidence)", () => {
    expect(detectHighImpressionsLowCtr([pageMetric({ impressions: 10, ctr: 0.01 })])).toEqual([]);
  });

  it("does not flag a healthy CTR", () => {
    expect(detectHighImpressionsLowCtr([pageMetric({ impressions: 1000, ctr: 0.15 })])).toEqual([]);
  });
});

describe("detectMidRankingPositions", () => {
  it("flags positions in the 5-20 band with real impressions", () => {
    const result = detectMidRankingPositions([pageMetric({ averagePosition: 8, impressions: 50 })]);
    expect(result).toHaveLength(1);
  });

  it("never claims average position is a guaranteed rank (documented in the evidence string)", () => {
    const result = detectMidRankingPositions([pageMetric({ averagePosition: 8, impressions: 50 })]);
    expect(result[0]!.evidence).toContain("Average position");
  });

  it("does not flag position 1 or position 30", () => {
    expect(detectMidRankingPositions([pageMetric({ averagePosition: 1, impressions: 50 })])).toEqual([]);
    expect(detectMidRankingPositions([pageMetric({ averagePosition: 30, impressions: 50 })])).toEqual([]);
  });
});

describe("detectCannibalization", () => {
  function queryMetric(overrides: Partial<SeoQueryMetric> = {}): SeoQueryMetric {
    return { query: "site web algerie", page: "/fr", clicks: 2, impressions: 100, ctr: 0.02, averagePosition: 10, dateRange: range, source: "GOOGLE_SEARCH_CONSOLE", ...overrides };
  }

  it("flags a query genuinely split across two competing pages", () => {
    const result = detectCannibalization([
      queryMetric({ page: "/fr", impressions: 300 }),
      queryMetric({ page: "/fr/services/developpement-web", impressions: 250 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("CANNIBALIZATION");
  });

  it("does NOT flag normal multi-page visibility where one page clearly dominates", () => {
    const result = detectCannibalization([
      queryMetric({ page: "/fr", impressions: 950 }),
      queryMetric({ page: "/fr/about", impressions: 50 }),
    ]);
    expect(result).toEqual([]);
  });

  it("does not flag a single-page query at all", () => {
    expect(detectCannibalization([queryMetric({ page: "/fr", impressions: 1000 })])).toEqual([]);
  });

  it("does not flag below the minimum impression threshold even if evenly split", () => {
    const result = detectCannibalization([
      queryMetric({ page: "/fr", impressions: 10 }),
      queryMetric({ page: "/fr/about", impressions: 10 }),
    ]);
    expect(result).toEqual([]);
  });
});

describe("detectContentDecay", () => {
  it("flags a real, material click decline over comparable equal-length ranges", () => {
    const previous = [pageMetric({ clicks: 100, dateRange: { start: "2026-07-01", end: "2026-07-31" } })];
    const current = [pageMetric({ clicks: 50, dateRange: { start: "2026-08-01", end: "2026-08-31" } })];
    const result = detectContentDecay(current, previous);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("DECLINING_CLICKS");
  });

  it("refuses to compare ranges of different lengths (7 days vs 90 days)", () => {
    const previous = [pageMetric({ clicks: 100, dateRange: { start: "2026-01-01", end: "2026-03-31" } })]; // ~90 days
    const current = [pageMetric({ clicks: 10, dateRange: { start: "2026-08-01", end: "2026-08-07" } })]; // 7 days
    expect(detectContentDecay(current, previous)).toEqual([]);
  });

  it("does not flag a modest, non-material change", () => {
    const previous = [pageMetric({ clicks: 100, dateRange: { start: "2026-07-01", end: "2026-07-31" } })];
    const current = [pageMetric({ clicks: 95, dateRange: { start: "2026-08-01", end: "2026-08-31" } })];
    expect(detectContentDecay(current, previous)).toEqual([]);
  });

  it("every result carries its date range", () => {
    const previous = [pageMetric({ clicks: 100, dateRange: { start: "2026-07-01", end: "2026-07-31" } })];
    const current = [pageMetric({ clicks: 20, dateRange: { start: "2026-08-01", end: "2026-08-31" } })];
    const result = detectContentDecay(current, previous);
    expect(result[0]!.dateRange).toEqual({ start: "2026-08-01", end: "2026-08-31" });
  });
});

describe("recommendationsFromAuditIssues", () => {
  function makeIssue(overrides: Partial<SeoIssue> = {}): SeoIssue {
    return { id: "x", type: "WARNING", page: "/en/services/x", message: "Short description.", recommendation: "Expand it.", source: "INTERNAL_AUDIT", detectedAt: new Date().toISOString(), ...overrides };
  }

  it("converts WARNING/OPPORTUNITY issues into recommendations, but never an ERROR", () => {
    const results = recommendationsFromAuditIssues([makeIssue({ type: "ERROR" }), makeIssue({ type: "WARNING" }), makeIssue({ type: "OPPORTUNITY" })]);
    expect(results).toHaveLength(2);
  });

  it("carries the original page/locale/reason/recommendation through untouched", () => {
    const [result] = recommendationsFromAuditIssues([makeIssue({ page: "/fr/about", locale: "fr" })]);
    expect(result!.page).toBe("/fr/about");
    expect(result!.locale).toBe("fr");
    expect(result!.reason).toBe("Short description.");
    expect(result!.recommendedAction).toBe("Expand it.");
    expect(result!.source).toBe("INTERNAL_AUDIT");
  });
});
