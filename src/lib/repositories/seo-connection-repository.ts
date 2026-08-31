import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { seoConnections } from "@/lib/db/schema";
import type { SeoConnectionProvider, SeoConnectionState, SeoConnectionStatus } from "@/domain/seo-intelligence";

function toState(row: typeof seoConnections.$inferSelect): SeoConnectionState {
  return {
    provider: row.provider as SeoConnectionProvider,
    status: row.status as SeoConnectionStatus,
    propertyIdentifier: row.propertyIdentifier ?? undefined,
    lastSyncedAt: row.lastSyncedAt ?? undefined,
    lastError: row.lastError ?? undefined,
    updatedAt: row.updatedAt,
  };
}

export interface SeoConnectionRepository {
  get(provider: SeoConnectionProvider): Promise<SeoConnectionState | null>;
  listAll(): Promise<SeoConnectionState[]>;
  upsert(provider: SeoConnectionProvider, patch: Partial<Omit<SeoConnectionState, "provider" | "updatedAt">>): Promise<SeoConnectionState>;
}

export class DrizzleSeoConnectionRepository implements SeoConnectionRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async get(provider: SeoConnectionProvider): Promise<SeoConnectionState | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(seoConnections).where(eq(seoConnections.provider, provider)).limit(1);
    return row ? toState(row) : null;
  }

  async listAll(): Promise<SeoConnectionState[]> {
    const db = await this.getDbInstance();
    const rows = await db.select().from(seoConnections);
    return rows.map(toState);
  }

  async upsert(provider: SeoConnectionProvider, patch: Partial<Omit<SeoConnectionState, "provider" | "updatedAt">>): Promise<SeoConnectionState> {
    const db = await this.getDbInstance();
    const [row] = await db
      .insert(seoConnections)
      .values({ provider, updatedAt: new Date(), ...patch })
      .onConflictDoUpdate({ target: seoConnections.provider, set: { ...patch, updatedAt: new Date() } })
      .returning();
    return toState(row);
  }
}

let repository: SeoConnectionRepository | null = null;

export function getSeoConnectionRepository(): SeoConnectionRepository {
  if (!repository) repository = new DrizzleSeoConnectionRepository();
  return repository;
}

export function createTestSeoConnectionRepository(getDbInstance: typeof getDb): SeoConnectionRepository {
  return new DrizzleSeoConnectionRepository(getDbInstance);
}
