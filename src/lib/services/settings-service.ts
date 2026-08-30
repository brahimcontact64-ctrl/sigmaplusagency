import { z } from "zod";
import { getSettingsRepository, type SettingsRepository } from "@/lib/repositories/settings-repository";
import { getAuditLogRepository, type AuditLogRepository } from "@/lib/repositories/audit-log-repository";
import type { AdminActor } from "@/domain/admin-user";
import {
  SETTINGS_KEYS,
  type SettingsKey,
  type CompanyIdentitySetting,
  type BudgetRangeLabelsSetting,
  type LeadSourceLabelsSetting,
} from "@/domain/settings";

const companyIdentitySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactEmail: z.email(),
  contactPhone: z.string().trim().min(1).max(60),
  whatsappNumber: z.string().trim().min(1).max(60),
}) satisfies z.ZodType<CompanyIdentitySetting>;

const labelMapSchema = z.record(z.string().min(1).max(80), z.string().trim().min(1).max(120)) satisfies z.ZodType<
  BudgetRangeLabelsSetting | LeadSourceLabelsSetting
>;

const SETTINGS_SCHEMAS = {
  company_identity: companyIdentitySchema,
  budget_range_labels: labelMapSchema,
  lead_source_labels: labelMapSchema,
} satisfies Record<SettingsKey, z.ZodType>;

export type SettingsMap = {
  company_identity?: CompanyIdentitySetting;
  budget_range_labels?: BudgetRangeLabelsSetting;
  lead_source_labels?: LeadSourceLabelsSetting;
};

export type UpdateSettingResult = { success: true } | { success: false; error: "invalid_key" | "invalid_value" };

/**
 * CRM-internal configuration only (see domain/settings.ts) — this does
 * NOT rewrite src/lib/site-config.ts or affect the public marketing
 * site, which intentionally keeps reading its own NEXT_PUBLIC_* env
 * vars for now. Wiring the two together is a Phase 6 candidate.
 */
export class SettingsService {
  constructor(
    private readonly repo: SettingsRepository = getSettingsRepository(),
    private readonly auditLog: AuditLogRepository = getAuditLogRepository(),
  ) {}

  async getAll(): Promise<SettingsMap> {
    const rows = await this.repo.getAll();
    const map: SettingsMap = {};
    for (const row of rows) {
      if ((SETTINGS_KEYS as readonly string[]).includes(row.key)) {
        (map as Record<string, unknown>)[row.key] = row.value;
      }
    }
    return map;
  }

  async update(key: string, value: unknown, actor: AdminActor): Promise<UpdateSettingResult> {
    if (!(SETTINGS_KEYS as readonly string[]).includes(key)) {
      return { success: false, error: "invalid_key" };
    }

    const schema = SETTINGS_SCHEMAS[key as SettingsKey];
    const parsed = schema.safeParse(value);
    if (!parsed.success) return { success: false, error: "invalid_value" };

    await this.repo.upsert(key as SettingsKey, parsed.data as never, actor.email);
    await this.auditLog.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "settings_updated",
      targetType: "setting",
      targetId: key,
    });

    return { success: true };
  }
}

let service: SettingsService | null = null;

export function getSettingsService(): SettingsService {
  if (!service) service = new SettingsService();
  return service;
}
