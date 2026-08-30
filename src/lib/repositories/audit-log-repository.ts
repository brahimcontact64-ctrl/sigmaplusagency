import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { adminAuditLogs } from "@/lib/db/schema";
import type { AuditAction, AuditLogEntry } from "@/domain/audit-log";

export type NewAuditLogInput = {
  actorId?: string;
  actorEmail: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

function toEntry(row: typeof adminAuditLogs.$inferSelect): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actorId ?? undefined,
    actorEmail: row.actorEmail,
    action: row.action as AuditAction,
    targetType: row.targetType ?? undefined,
    targetId: row.targetId ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt,
  };
}

export interface AuditLogRepository {
  record(input: NewAuditLogInput): Promise<void>;
  listRecent(limit: number): Promise<AuditLogEntry[]>;
}

export class DrizzleAuditLogRepository implements AuditLogRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async record(input: NewAuditLogInput): Promise<void> {
    const db = await this.getDbInstance();
    await db.insert(adminAuditLogs).values(input);
  }

  async listRecent(limit: number): Promise<AuditLogEntry[]> {
    const db = await this.getDbInstance();
    const rows = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(limit);
    return rows.map(toEntry);
  }
}

let repository: AuditLogRepository | null = null;

export function getAuditLogRepository(): AuditLogRepository {
  if (!repository) repository = new DrizzleAuditLogRepository();
  return repository;
}

export function createTestAuditLogRepository(getDbInstance: typeof getDb): AuditLogRepository {
  return new DrizzleAuditLogRepository(getDbInstance);
}
