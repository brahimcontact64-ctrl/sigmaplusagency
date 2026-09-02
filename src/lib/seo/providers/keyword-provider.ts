import { getSeoConnectionRepository } from "@/lib/repositories/seo-connection-repository";
import type { SeoConnectionState, KeywordProvider, SeoKeywordSeed, SeoKeywordCheck } from "@/domain/seo-intelligence";

/**
 * SERP/keyword provider abstraction (Phase 12 §7) — deliberately
 * vendor-neutral: nothing outside this file knows or cares which SERP
 * vendor (if any) is configured. `SERP_PROVIDER` names which
 * implementation to use; only "NONE" (the honest default) exists
 * today. Adding a real vendor later means adding one more class here
 * and one branch in `getKeywordProvider()` — never touching the job
 * that calls it.
 */
const PROVIDER = "SERP" as const;

class NullKeywordProvider implements KeywordProvider {
  isConfigured(): boolean {
    return false;
  }
  providerId(): string {
    return "NONE";
  }
  async checkPositions(seeds: SeoKeywordSeed[]): Promise<SeoKeywordCheck[]> {
    void seeds;
    return [];
  }
}

/**
 * No real vendor is wired up (no credentials, no vendor chosen) — this
 * always returns the `NullKeywordProvider`. `SERP_API_KEY` alone is
 * never sufficient to claim CONNECTED, matching the GSC/GA4/PageSpeed
 * adapters' honesty policy exactly.
 */
export function getKeywordProvider(): KeywordProvider {
  return new NullKeywordProvider();
}

export async function getKeywordProviderConnection(): Promise<SeoConnectionState> {
  const repo = getSeoConnectionRepository();
  const configured = Boolean(process.env.SERP_PROVIDER && process.env.SERP_PROVIDER !== "NONE" && process.env.SERP_API_KEY);

  if (!configured) {
    return repo.upsert(PROVIDER, { status: "NOT_CONFIGURED", propertyIdentifier: undefined, lastError: undefined });
  }

  return repo.upsert(PROVIDER, {
    status: "ERROR",
    propertyIdentifier: process.env.SERP_PROVIDER,
    lastError: `SERP_PROVIDER="${process.env.SERP_PROVIDER}" is configured but no real client for it is implemented yet.`,
  });
}
