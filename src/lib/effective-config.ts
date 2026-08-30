import { unstable_cache, revalidateTag } from "next/cache";
import { siteConfig } from "./site-config";
import { getSettingsRepository } from "./repositories/settings-repository";
import { applyCompanyIdentityOverride, type EffectiveSiteConfig } from "./site-config-merge";
import type { CompanyIdentitySetting } from "@/domain/settings";

export const SITE_SETTINGS_CACHE_TAG = "site-settings:company-identity";
export type { EffectiveSiteConfig };

/**
 * DB-configured company identity, falling back to the env-based
 * `siteConfig` for anything unset or if the DB is unreachable — the
 * public site must never break because a setting couldn't be read
 * (master plan Phase 6 §24). Secrets never live here; this only ever
 * carries the same non-secret fields siteConfig already exposes.
 *
 * Cached via Next's `unstable_cache` (5 min, tag-invalidated) rather
 * than queried per component — `updateSettingAction` calls
 * `revalidateTag(SITE_SETTINGS_CACHE_TAG)` after a `company_identity`
 * write so a change shows up immediately, not after the TTL.
 */
const getCachedCompanyIdentity = unstable_cache(
  async (): Promise<CompanyIdentitySetting | null> => {
    const rows = await getSettingsRepository().getAll();
    const row = rows.find((r) => r.key === "company_identity");
    return (row?.value as CompanyIdentitySetting | undefined) ?? null;
  },
  ["effective-site-config:company-identity"],
  { tags: [SITE_SETTINGS_CACHE_TAG], revalidate: 300 },
);

export async function getEffectiveSiteConfig(): Promise<EffectiveSiteConfig> {
  try {
    const override = await getCachedCompanyIdentity();
    return applyCompanyIdentityOverride(siteConfig, override);
  } catch (error) {
    console.error("[effective-config] falling back to env siteConfig:", error);
    return siteConfig;
  }
}

export async function getEffectiveWhatsAppUrl(message?: string): Promise<string> {
  const config = await getEffectiveSiteConfig();
  const base = `https://wa.me/${config.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function invalidateEffectiveSiteConfig(): void {
  // Next 16's revalidateTag requires a cache-life profile as the
  // second argument — "max" here just means "revalidate now,"
  // matching Next's own on-demand-revalidation example.
  revalidateTag(SITE_SETTINGS_CACHE_TAG, "max");
}
