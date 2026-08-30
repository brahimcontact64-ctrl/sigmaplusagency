import { getDb } from "@/lib/db/client";
import { siteSettings } from "@/lib/db/schema";
import type { SettingsKey, SettingValueFor } from "@/domain/settings";

export interface SettingsRepository {
  getAll(): Promise<{ key: string; value: unknown; updatedAt: Date; updatedByEmail?: string }[]>;
  upsert<K extends SettingsKey>(key: K, value: SettingValueFor<K>, updatedByEmail: string): Promise<void>;
}

export class DrizzleSettingsRepository implements SettingsRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async getAll() {
    const db = await this.getDbInstance();
    const rows = await db.select().from(siteSettings);
    return rows.map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt,
      updatedByEmail: row.updatedByEmail ?? undefined,
    }));
  }

  async upsert<K extends SettingsKey>(key: K, value: SettingValueFor<K>, updatedByEmail: string): Promise<void> {
    const db = await this.getDbInstance();
    await db
      .insert(siteSettings)
      .values({ key, value, updatedByEmail, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedByEmail, updatedAt: new Date() },
      });
  }
}

let repository: SettingsRepository | null = null;

export function getSettingsRepository(): SettingsRepository {
  if (!repository) repository = new DrizzleSettingsRepository();
  return repository;
}

export function createTestSettingsRepository(getDbInstance: typeof getDb): SettingsRepository {
  return new DrizzleSettingsRepository(getDbInstance);
}
