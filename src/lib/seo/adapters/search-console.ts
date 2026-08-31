/**
 * Google Search Console integration boundary — see docs/SEO_STRATEGY.md
 * "External integration adapters". No credentials exist yet, so this
 * never fakes connected data; it reports "not connected" honestly. A
 * real implementation (Search Console API + a service account or
 * OAuth token) is future work — this module exists so the Admin SEO
 * page and any future caller depend on a stable shape rather than
 * being written against a live API from day one.
 */
export type SearchConsoleStatus =
  | { connected: false }
  | {
      connected: true;
      // Shape reserved for the real integration — queries/pages/clicks/
      // impressions/CTR/average position/indexing diagnostics.
      summary: { totalClicks: number; totalImpressions: number; averageCtr: number; averagePosition: number };
    };

export function getSearchConsoleStatus(): SearchConsoleStatus {
  const configured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL && process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON);
  if (!configured) return { connected: false };

  // Credentials present but the real API call isn't implemented this
  // phase — still report "not connected" rather than inventing a
  // response, per the brief's explicit "do not fake connected data".
  return { connected: false };
}
