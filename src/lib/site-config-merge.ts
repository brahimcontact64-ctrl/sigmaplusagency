import type { CompanyIdentitySetting } from "@/domain/settings";

export type EffectiveSiteConfig = {
  name: string;
  legalName: string;
  url: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
};

/**
 * Pure merge, deliberately free of `next/cache`/`unstable_cache` and
 * any DB import — mirrors the src/lib/auth/rbac.ts split: this is the
 * one part of the effective-config system that's safe to unit-test in
 * Vitest, since `unstable_cache` (like `next/headers`) only resolves
 * inside a real Next.js server runtime.
 */
export function applyCompanyIdentityOverride(
  base: EffectiveSiteConfig,
  override: CompanyIdentitySetting | null,
): EffectiveSiteConfig {
  if (!override) return base;
  return {
    ...base,
    name: override.companyName?.trim() || base.name,
    whatsappNumber: override.whatsappNumber?.trim() || base.whatsappNumber,
    contactPhone: override.contactPhone?.trim() || base.contactPhone,
    contactEmail: override.contactEmail?.trim() || base.contactEmail,
  };
}
