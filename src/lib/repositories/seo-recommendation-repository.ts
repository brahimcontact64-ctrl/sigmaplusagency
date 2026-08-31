import { and, desc, eq } from "drizzle-orm";
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
}

let repository: SeoRecommendationRepository | null = null;

export function getSeoRecommendationRepository(): SeoRecommendationRepository {
  if (!repository) repository = new DrizzleSeoRecommendationRepository();
  return repository;
}

export function createTestSeoRecommendationRepository(getDbInstance: typeof getDb): SeoRecommendationRepository {
  return new DrizzleSeoRecommendationRepository(getDbInstance);
}
