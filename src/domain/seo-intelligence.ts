import type { SeoProvenance } from "./seo-issue";

/**
 * The layer above Phase 7's deterministic audit engine — see
 * docs/SEO_STRATEGY.md "SEO intelligence architecture". Types here are
 * intentionally broader than what's persisted today (Phase 8 §29: "do
 * not necessarily persist every concept if not useful yet") — metric
 * snapshot shapes exist so a real sync function has something concrete
 * to return, without a database table sitting empty for data that
 * can't arrive without credentials that don't exist yet.
 */

export const SEO_CONNECTION_PROVIDERS = ["GOOGLE_SEARCH_CONSOLE", "GOOGLE_ANALYTICS", "PAGESPEED"] as const;
export type SeoConnectionProvider = (typeof SEO_CONNECTION_PROVIDERS)[number];

/** Never show CONNECTED unless a real successful sync actually happened — see Phase 8 §41 "do not show green/healthy when no external connection exists." */
export const SEO_CONNECTION_STATUSES = ["NOT_CONFIGURED", "CONNECTED", "ERROR", "EXPIRED"] as const;
export type SeoConnectionStatus = (typeof SEO_CONNECTION_STATUSES)[number];

export type SeoConnectionState = {
  provider: SeoConnectionProvider;
  status: SeoConnectionStatus;
  /** A non-secret identifier only (e.g. a GSC site URL, a GA property ID) — never a credential/token. See §51. */
  propertyIdentifier?: string;
  lastSyncedAt?: Date;
  lastError?: string;
  updatedAt: Date;
};

/** A date range is mandatory on every metric — never present a number without saying what period it covers (§48). */
export type SeoDateRange = { start: string; end: string };

export type SeoPageMetric = {
  page: string;
  locale?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  dateRange: SeoDateRange;
  source: Extract<SeoProvenance, "GOOGLE_SEARCH_CONSOLE">;
};

export type SeoQueryMetric = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  dateRange: SeoDateRange;
  source: Extract<SeoProvenance, "GOOGLE_SEARCH_CONSOLE">;
};

export type SeoAnalyticsPageMetric = {
  page: string;
  sessions: number;
  conversions: number;
  dateRange: SeoDateRange;
  source: Extract<SeoProvenance, "GOOGLE_ANALYTICS">;
};

/** FIELD (real-user CrUX data) and LAB (synthetic Lighthouse run) are never merged — Phase 8 §35. */
export const PAGESPEED_DATA_KINDS = ["FIELD", "LAB"] as const;
export type PageSpeedDataKind = (typeof PAGESPEED_DATA_KINDS)[number];

export type PageSpeedMetric = {
  page: string;
  kind: PageSpeedDataKind;
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  lcpMs?: number;
  cls?: number;
  inpMs?: number;
  retrievedAt: string;
};

export const SEO_OPPORTUNITY_TYPES = [
  "HIGH_IMPRESSIONS_LOW_CTR",
  "MID_RANKING_POSITION",
  "DECLINING_CLICKS",
  "WEAK_METADATA_WITH_IMPRESSIONS",
  "CANNIBALIZATION",
  "HIGH_TRAFFIC_LOW_CONVERSION",
  "PERFORMANCE_REGRESSION",
] as const;
export type SeoOpportunityType = (typeof SEO_OPPORTUNITY_TYPES)[number];

export type SeoOpportunity = {
  id: string;
  type: SeoOpportunityType;
  page: string;
  locale?: string;
  /** 0-1 — how confident the rule is in this specific instance (e.g. cannibalization needs enough shared impressions to be meaningful, not just "two pages rank for something similar"). */
  confidence: number;
  evidence: string;
  dateRange: SeoDateRange;
  source: SeoProvenance;
  generatedAt: string;
};

export const SEO_RECOMMENDATION_STATUSES = ["DRAFT", "RECOMMENDED", "APPROVED", "PUBLISHED", "REJECTED"] as const;
export type SeoRecommendationStatus = (typeof SEO_RECOMMENDATION_STATUSES)[number];

/**
 * Approval-first, always (Phase 8 §43): nothing in this codebase moves
 * a recommendation to APPROVED/PUBLISHED except an explicit admin
 * action (`seo-recommendation-service.ts`) — an opportunity or an AI
 * suggestion can populate `DRAFT`/`RECOMMENDED` but never anything
 * further, and no code path here ever rewrites a title, publishes an
 * article, or changes a canonical/redirect on its own.
 */
export type SeoRecommendation = {
  id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  page: string;
  locale?: string;
  reason: string;
  recommendedAction: string;
  source: SeoProvenance;
  confidence: number;
  generatedAt: string;
  status: SeoRecommendationStatus;
  reviewedByEmail?: string;
  reviewedAt?: string;
};

/** Prepared, not implemented — Phase 8 §46. No competitor is ever inferred/scraped; an admin defines one manually if/when useful. */
export type SeoCompetitor = {
  id: string;
  domain: string;
  name: string;
  market: string;
  notes?: string;
  active: boolean;
};

/** Prepared, not implemented — Phase 8 §45. Algeria keyword hypotheses (docs/SEO_STRATEGY.md §13) remain hypotheses; this is the shape a real provider would fill. */
export interface KeywordProvider {
  isConfigured(): boolean;
  research(seed: string, locale: string): Promise<{ keyword: string; note: string }[]>;
}
