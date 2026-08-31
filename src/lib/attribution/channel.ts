export const CHANNELS = ["direct", "organic_search", "paid_search", "social", "email", "referral", "other"] as const;
export type Channel = (typeof CHANNELS)[number];

const SEARCH_ENGINE_HINTS = ["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu"];
const SOCIAL_HINTS = ["facebook", "instagram", "linkedin", "twitter", "x.com", "tiktok", "youtube", "whatsapp"];

/**
 * Deterministic single-touch channel classification (Phase 9 §9-10) —
 * a simple, documented heuristic over the "First Touch" attribution
 * already captured once per lead in `lead-service.ts`, NOT a
 * multi-touch attribution model or a certified marketing-analytics
 * product. Given only what was actually recorded at that first touch
 * (UTM params, referrer), bucket it into one broad channel for the
 * Admin Acquisition report. See docs/ANALYTICS_MEASUREMENT_PLAN.md.
 */
export function classifyChannel(input: { utmSource?: string | null; utmMedium?: string | null; referrer?: string | null }): Channel {
  const medium = input.utmMedium?.toLowerCase().trim();
  const source = input.utmSource?.toLowerCase().trim() ?? "";

  if (medium === "email" || medium === "newsletter") return "email";
  if (medium && SOCIAL_HINTS.some((h) => source.includes(h) || medium.includes(h))) return "social";
  if (medium === "cpc" || medium === "ppc" || medium === "paid" || medium === "paidsearch") return "paid_search";
  if (medium === "social") return "social";
  if (SEARCH_ENGINE_HINTS.some((h) => source.includes(h))) return "organic_search";
  if (medium || source) return "other";

  if (!input.referrer) return "direct";
  try {
    const host = new URL(input.referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (SEARCH_ENGINE_HINTS.some((h) => host.includes(h))) return "organic_search";
    if (SOCIAL_HINTS.some((h) => host.includes(h))) return "social";
    return "referral";
  } catch {
    return "other";
  }
}
