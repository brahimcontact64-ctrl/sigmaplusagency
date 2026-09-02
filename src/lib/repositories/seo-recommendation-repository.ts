import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { seoRecommendations } from "@/lib/db/schema";
import type { SeoRecommendation, SeoRecommendationStatus } from "@/domain/seo-intelligence";
import type { SeoProvenance } from "@/domain/seo-issue";

export type NewSeoRecommendationInput = Omit<SeoRecommendation, "id" | "generatedAt" | "status" | "reviewedByEmail" | "reviewedAt"> & {
  status?: SeoRecommendationStatus;
};

function toRecommendation(row: typeof seoRecommendations.$inferSelect): SeoRecommendation {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity as SeoRecommendation["severity"],
    page: row.page,
    locale: row.locale ?? undefined,
    reason: row.reason,
    recommendedAction: row.recommendedAction,
    source: row.source as SeoProvenance,
    confidence: row.confidence,
    generatedAt: row.generatedAt.toISOString(),
    status: row.status as SeoRecommendationStatus,
    reviewedByEmail: row.reviewedByEmail ?? undefined,
    reviewedAt: row.reviewedAt?.toISOString(),
  };
}

export interface SeoRecommendationRepository {
  create(input: NewSeoRecommendationInput): Promise<SeoRecommendation>;
  list(filters: { status?: SeoRecommendationStatus }): Promise<SeoRecommendation[]>;
  get(id: string): Promise<SeoRecommendation | null>;
  updateStatus(id: string, status: SeoRecommendationStatus, reviewedByEmail: string): Promise<SeoRecommendation | null>;
  /**
   * Phase 12 dedup fix (job orchestration §3/§17: "retries must not
   * create duplicate recommendations") — deterministic identity is
   * {type, page, locale, source}. `type` already namespaces by
   * originating engine (`audit:*` vs `opportunity:<opportunity-type>`),
   * and `source` is included explicitly too so two different providers
   * could never collide on an identical type/page/locale in the
   * future. Deliberately NOT windowed by analysis period/version: the
   * goal is "don't pile a duplicate onto an already-open, not-yet-
   * reviewed recommendation," not "one row per analysis run" — an open
   * (DRAFT/RECOMMENDED) row already covering this identity is the
   * dedup boundary. A rejected/approved/published row never counts as
   * a duplicate: if a human already acted on it, a fresh finding of
   * the same underlying issue later deserves a new row, not silent
   * suppression forever.
   */
  findOpenDuplicate(type: string, page: string, locale: string | undefined, source: string): Promise<SeoRecommendation | null>;
}

export class DrizzleSeoRecommendationRepository implements SeoRecommendationRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async create(input: NewSeoRecommendationInput): Promise<SeoRecommendation> {
    const db = await this.getDbInstance();
    const [row] = await db
      .insert(seoRecommendations)
      .values({ ...input, status: input.status ?? "RECOMMENDED" })
      .returning();
    return toRecommendation(row);
  }

  async list(filters: { status?: SeoRecommendationStatus }): Promise<SeoRecommendation[]> {
    const db = await this.getDbInstance();
    const where = filters.status ? eq(seoRecommendations.status, filters.status) : undefined;
    const rows = await db.select().from(seoRecommendations).where(where).orderBy(desc(seoRecommendations.generatedAt));
    return rows.map(toRecommendation);
  }

  async get(id: string): Promise<SeoRecommendation | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(seoRecommendations).where(eq(seoRecommendations.id, id)).limit(1);
    return row ? toRecommendation(row) : null;
  }

  async updateStatus(id: string, status: SeoRecommendationStatus, reviewedByEmail: string): Promise<SeoRecommendation | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .update(seoRecommendations)
      .set({ status, reviewedByEmail, reviewedAt: new Date() })
      .where(and(eq(seoRecommendations.id, id)))
      .returning();
    return row ? toRecommendation(row) : null;
  }

  async findOpenDuplicate(type: string, page: string, locale: string | undefined, source: string): Promise<SeoRecommendation | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .select()
      .from(seoRecommendations)
      .where(
        and(
          eq(seoRecommendations.type, type),
          eq(seoRecommendations.page, page),
          locale ? eq(seoRecommendations.locale, locale) : isNull(seoRecommendations.locale),
          eq(seoRecommendations.source, source),
          inArray(seoRecommendations.status, ["DRAFT", "RECOMMENDED"]),
        ),
      )
      .limit(1);
    return row ? toRecommendation(row) : null;
  }
}

let repository: SeoRecommendationRepository | null = null;

export function getSeoRecommendationRepository(): SeoRecommendationRepository {
  if (!repository) repository = new DrizzleSeoRecommendationRepository();
  return repository;
}

export function createTestSeoRecommendationRepository(getDbInstance: typeof getDb): SeoRecommendationRepository {
  return new DrizzleSeoRecommendationRepository(getDbInstance);
}
