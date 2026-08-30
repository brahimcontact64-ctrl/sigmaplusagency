/**
 * Business configuration that's genuinely useful to edit at runtime
 * without a deploy. Deliberately small for Phase 5 — see master plan
 * "Settings foundation" for what's intentionally out of scope (secrets
 * stay in env vars; the public marketing site still reads siteConfig
 * from NEXT_PUBLIC_* env vars rather than these rows).
 *
 * Each key's value shape is fixed and validated in settings-service —
 * this file only declares the stable key IDs and their TypeScript shape.
 */
export const SETTINGS_KEYS = ["company_identity", "budget_range_labels", "lead_source_labels"] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export type CompanyIdentitySetting = {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
};

/** budgetRangeId -> admin-facing label. Falls back to the canonical ID (from src/config/budget-ranges.ts) when unset. */
export type BudgetRangeLabelsSetting = Record<string, string>;

/** LeadSource -> admin-facing label. Falls back to the canonical source ID when unset. */
export type LeadSourceLabelsSetting = Record<string, string>;

export type SettingValueFor<K extends SettingsKey> = K extends "company_identity"
  ? CompanyIdentitySetting
  : K extends "budget_range_labels"
    ? BudgetRangeLabelsSetting
    : LeadSourceLabelsSetting;

export type SiteSetting<K extends SettingsKey = SettingsKey> = {
  key: K;
  value: SettingValueFor<K>;
  updatedAt: Date;
  updatedByEmail?: string;
};
