/**
 * Future PageSpeed Insights / Lighthouse data adapter. Not blocked on
 * an API key this phase (the brief is explicit about that) — reports
 * "not connected" until PAGESPEED_API_KEY is configured and a real
 * implementation calls the API. Architectural CWV risk review lives in
 * docs/SEO_STRATEGY.md "Core Web Vitals" instead, since that can be
 * written today without measured data.
 */
export type PageSpeedStatus =
  | { connected: false }
  | { connected: true; summary: { lcpMs: number; cls: number; inpMs: number } };

export function getPageSpeedStatus(): PageSpeedStatus {
  if (!process.env.PAGESPEED_API_KEY) return { connected: false };
  return { connected: false };
}
