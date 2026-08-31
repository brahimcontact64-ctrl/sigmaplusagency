import { getSeoConnectionRepository } from "@/lib/repositories/seo-connection-repository";
import type { SeoConnectionState, SeoAnalyticsPageMetric } from "@/domain/seo-intelligence";

/**
 * Future GA4 *reporting* adapter — deliberately distinct from
 * `src/lib/integrations/analytics.ts`'s `track()`, which sends
 * outbound events and has nothing to do with reading data back. No
 * credentials → NOT_CONFIGURED, same policy as the Search Console
 * adapter (persisted connection state, not a bare boolean).
 */
const PROVIDER = "GOOGLE_ANALYTICS" as const;

export async function getAnalyticsReportingConnection(): Promise<SeoConnectionState> {
  const configured = Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS_JSON);
  const repo = getSeoConnectionRepository();

  if (!configured) {
    return repo.upsert(PROVIDER, { status: "NOT_CONFIGURED", propertyIdentifier: undefined, lastError: undefined });
  }

  return repo.upsert(PROVIDER, {
    status: "ERROR",
    propertyIdentifier: process.env.GA4_PROPERTY_ID,
    lastError: "Credentials configured but the GA4 Data API client is not yet implemented.",
  });
}

export async function syncAnalyticsReporting(): Promise<{ state: SeoConnectionState; pageMetrics: SeoAnalyticsPageMetric[] }> {
  const state = await getAnalyticsReportingConnection();
  return { state, pageMetrics: [] };
}
