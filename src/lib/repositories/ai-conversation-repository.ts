import { and, asc, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { aiConversations, aiMessages } from "@/lib/db/schema";
import type { AiConversation, AiConversationStatus, AiMessage, AiMessageRole } from "@/domain/ai-conversation";
import { EMPTY_QUALIFICATION_STATE, type QualificationState } from "@/domain/ai-qualification";

function toConversation(row: typeof aiConversations.$inferSelect): AiConversation {
  return {
    id: row.id,
    sessionId: row.sessionId,
    locale: row.locale,
    leadId: row.leadId ?? undefined,
    projectRequestId: row.projectRequestId ?? undefined,
    status: row.status as AiConversationStatus,
    qualificationState: row.qualificationState as QualificationState,
    summary: row.summary ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toMessage(row: typeof aiMessages.$inferSelect): AiMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as AiMessageRole,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export interface AiConversationRepository {
  create(sessionId: string, locale: string): Promise<AiConversation>;
  /** Ownership-checked: returns null if the conversation doesn't exist OR belongs to a different session. */
  findByIdForSession(id: string, sessionId: string): Promise<AiConversation | null>;
  appendMessage(conversationId: string, role: AiMessageRole, content: string): Promise<AiMessage>;
  listMessages(conversationId: string, limit?: number): Promise<AiMessage[]>;
  countMessages(conversationId: string): Promise<number>;
  updateQualificationState(conversationId: string, state: QualificationState): Promise<void>;
  updateSummary(conversationId: string, summary: string): Promise<void>;
  linkLead(conversationId: string, leadId: string, projectRequestId?: string): Promise<void>;
  markStatus(conversationId: string, status: AiConversationStatus): Promise<void>;
  /** Admin-only accessor (no sessionId ownership check) used by the Lead Detail AI section. */
  findByLeadId(leadId: string): Promise<AiConversation | null>;
}

export class DrizzleAiConversationRepository implements AiConversationRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async create(sessionId: string, locale: string): Promise<AiConversation> {
    const db = await this.getDbInstance();
    const [row] = await db
      .insert(aiConversations)
      .values({ sessionId, locale, qualificationState: EMPTY_QUALIFICATION_STATE })
      .returning();
    return toConversation(row);
  }

  async findByIdForSession(id: string, sessionId: string): Promise<AiConversation | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.id, id), eq(aiConversations.sessionId, sessionId)))
      .limit(1);
    return row ? toConversation(row) : null;
  }

  async findByLeadId(leadId: string): Promise<AiConversation | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(aiConversations).where(eq(aiConversations.leadId, leadId)).limit(1);
    return row ? toConversation(row) : null;
  }

  async appendMessage(conversationId: string, role: AiMessageRole, content: string): Promise<AiMessage> {
    const db = await this.getDbInstance();
    const [row] = await db.insert(aiMessages).values({ conversationId, role, content }).returning();
    await db.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, conversationId));
    return toMessage(row);
  }

  async listMessages(conversationId: string, limit?: number): Promise<AiMessage[]> {
    const db = await this.getDbInstance();
    const query = db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(asc(aiMessages.createdAt));
    const rows = limit ? await query.limit(limit) : await query;
    return rows.map(toMessage);
  }

  async countMessages(conversationId: string): Promise<number> {
    const db = await this.getDbInstance();
    const [{ value }] = await db.select({ value: count() }).from(aiMessages).where(eq(aiMessages.conversationId, conversationId));
    return value;
  }

  async updateQualificationState(conversationId: string, state: QualificationState): Promise<void> {
    const db = await this.getDbInstance();
    await db.update(aiConversations).set({ qualificationState: state, updatedAt: new Date() }).where(eq(aiConversations.id, conversationId));
  }

  async updateSummary(conversationId: string, summary: string): Promise<void> {
    const db = await this.getDbInstance();
    await db.update(aiConversations).set({ summary }).where(eq(aiConversations.id, conversationId));
  }

  async linkLead(conversationId: string, leadId: string, projectRequestId?: string): Promise<void> {
    const db = await this.getDbInstance();
    await db
      .update(aiConversations)
      .set({ leadId, projectRequestId, status: "converted", updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));
  }

  async markStatus(conversationId: string, status: AiConversationStatus): Promise<void> {
    const db = await this.getDbInstance();
    await db.update(aiConversations).set({ status }).where(eq(aiConversations.id, conversationId));
  }
}

let repository: AiConversationRepository | null = null;

export function getAiConversationRepository(): AiConversationRepository {
  if (!repository) repository = new DrizzleAiConversationRepository();
  return repository;
}

export function createTestAiConversationRepository(getDbInstance: typeof getDb): AiConversationRepository {
  return new DrizzleAiConversationRepository(getDbInstance);
}
