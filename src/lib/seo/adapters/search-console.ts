import { getSeoConnectionRepository } from "@/lib/repositories/seo-connection-repository";
import type { SeoConnectionState, SeoPageMetric, SeoQueryMetric } from "@/domain/seo-intelligence";

/**
 * Google Search Console integration boundary — see docs/SEO_STRATEGY.md
 * "External integration adapters". No credentials exist yet, so this
 * never fakes connected data; it reports NOT_CONFIGURED honestly and
 * persists that state (rather than just returning a boolean) so the
 * connection's last-known status/error survives a request and the
 * admin can see NOT_CONFIGURED/ERROR/EXPIRED distinctly per Phase 8 §41.
 *
 * A real implementation calls Search Console's supported API via an
 * OAuth/service-account flow — not implemented here (no credentials to
 * implement against), and this module explicitly never scrapes.
 */
const PROVIDER = "GOOGLE_SEARCH_CONSOLE" as const;

export async function getSearchConsoleConnection(): Promise<SeoConnectionState> {
  const configured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL && process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON);
  const repo = getSeoConnectionRepository();

  if (!configured) {
    return repo.upsert(PROVIDER, { status: "NOT_CONFIGURED", propertyIdentifier: undefined, lastError: undefined });
  }

  // Credentials present but the real API call isn't implemented this
  // phase — record an explicit, honest ERROR rather than pretending to
  // be CONNECTED. Never a silent NOT_CONFIGURED once credentials exist,
  // since that would hide a real misconfiguration from the admin.
  return repo.upsert(PROVIDER, {
    status: "ERROR",
    propertyIdentifier: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL,
    lastError: "Credentials configured but the Search Console API client is not yet implemented.",
  });
}

/**
 * Idempotent sync skeleton (Phase 8 §49): callable today, does nothing
 * destructive, safe to call repeatedly or from a future cron. Returns
 * the connection state it recorded rather than throwing, so a caller
 * (e.g. a future scheduled job) can log the outcome without a try/catch
 * around a thrown error for the extremely common "not configured" case.
 */
export async function syncSearchConsole(): Promise<{ state: SeoConnectionState; pageMetrics: SeoPageMetric[]; queryMetrics: SeoQueryMetric[] }> {
  const state = await getSearchConsoleConnection();
  // No real fetch happens while disconnected/erroring — never fabricate rows.
  return { state, pageMetrics: [], queryMetrics: [] };
}
