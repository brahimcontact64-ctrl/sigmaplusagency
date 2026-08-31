/**
 * Future GA4 *reporting* adapter — deliberately distinct from
 * `src/lib/integrations/analytics.ts`'s `track()`, which sends
 * outbound events and has nothing to do with reading data back. This
 * module is the read-side boundary (conversions, landing-page
 * performance) for a future real GA4 Data API integration. No
 * credentials → not connected, same policy as the Search Console
 * adapter.
 */
export type AnalyticsReportingStatus =
  | { connected: false }
  | { connected: true; summary: { sessions: number; conversions: number } };

export function getAnalyticsReportingStatus(): AnalyticsReportingStatus {
  const configured = Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS_JSON);
  if (!configured) return { connected: false };
  return { connected: false };
}
