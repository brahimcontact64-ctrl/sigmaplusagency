import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { articles, articleTranslations, articleSlugRedirects } from "@/lib/db/schema";
import type { Locale } from "@/i18n/routing";
import type { Article, ArticleTranslation, ArticleType, ArticleCategory, ContentStatus, ArticleWithTranslation } from "@/domain/article";
import type { ServiceId } from "@/domain/service";
import type { ProjectId } from "@/domain/case-study";

export type NewArticleInput = {
  type: ArticleType;
  category: ArticleCategory;
  tags?: string[];
  author: string;
  featured?: boolean;
  relatedServices?: ServiceId[];
  relatedCaseStudies?: ProjectId[];
};

export type NewTranslationInput = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  editorEmail?: string;
};

export type TranslationPatch = Partial<Omit<NewTranslationInput, "locale">>;

export type ChangeSlugResult = { success: true; translation: ArticleTranslation } | { success: false; error: "slug_taken" | "not_found" };

export type AdminArticleListFilters = { status?: ContentStatus; locale?: Locale; category?: ArticleCategory; search?: string };
export type AdminArticleRow = ArticleWithTranslation;

function toArticle(row: typeof articles.$inferSelect): Article {
  return {
    id: row.id,
    type: row.type as ArticleType,
    category: row.category as ArticleCategory,
    tags: row.tags,
    author: row.author,
    featured: row.featured,
    relatedServices: row.relatedServices as ServiceId[],
    relatedCaseStudies: row.relatedCaseStudies as ProjectId[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toTranslation(row: typeof articleTranslations.$inferSelect): ArticleTranslation {
  return {
    id: row.id,
    articleId: row.articleId,
    locale: row.locale as Locale,
    status: row.status as ContentStatus,
    slug: row.slug,
    title: row.title,
    description: row.description,
    excerpt: row.excerpt,
    content: row.content,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    ogImage: row.ogImage ?? undefined,
    editorEmail: row.editorEmail ?? undefined,
    publishedAt: row.publishedAt ?? undefined,
    updatedAt: row.updatedAt,
  };
}

export interface ArticleRepository {
  createArticle(input: NewArticleInput): Promise<Article>;
  updateArticle(id: string, patch: Partial<NewArticleInput>): Promise<Article | null>;
  getArticle(id: string): Promise<Article | null>;
  createTranslation(articleId: string, input: NewTranslationInput): Promise<ArticleTranslation>;
  updateTranslation(translationId: string, patch: TranslationPatch): Promise<ArticleTranslation | null>;
  getTranslation(translationId: string): Promise<ArticleTranslation | null>;
  getTranslationsForArticle(articleId: string): Promise<ArticleTranslation[]>;
  changeSlug(translationId: string, newSlug: string): Promise<ChangeSlugResult>;
  changeStatus(translationId: string, status: ContentStatus): Promise<ArticleTranslation | null>;
  slugExists(locale: Locale, slug: string, excludeTranslationId?: string): Promise<boolean>;
  findPublishedBySlug(locale: Locale, slug: string): Promise<ArticleWithTranslation | null>;
  resolveRedirect(locale: Locale, oldSlug: string): Promise<{ articleId: string; currentSlug: string } | null>;
  listPublished(
    locale: Locale,
    filters: { category?: ArticleCategory },
    page: number,
    pageSize: number,
  ): Promise<{ items: ArticleWithTranslation[]; total: number }>;
  getFeaturedPublished(locale: Locale, limit: number): Promise<ArticleWithTranslation[]>;
  getRecentPublished(locale: Locale, limit: number, excludeArticleId?: string): Promise<ArticleWithTranslation[]>;
  listAllPublishedTranslations(): Promise<ArticleWithTranslation[]>;
  listForAdmin(filters: AdminArticleListFilters, page: number, pageSize: number): Promise<{ items: AdminArticleRow[]; total: number }>;
  countByStatus(): Promise<Record<ContentStatus, number>>;
}

export class DrizzleArticleRepository implements ArticleRepository {
  constructor(private readonly getDbInstance: typeof getDb = getDb) {}

  async createArticle(input: NewArticleInput): Promise<Article> {
    const db = await this.getDbInstance();
    const [row] = await db
      .insert(articles)
      .values({
        type: input.type,
        category: input.category,
        tags: input.tags ?? [],
        author: input.author,
        featured: input.featured ?? false,
        relatedServices: input.relatedServices ?? [],
        relatedCaseStudies: input.relatedCaseStudies ?? [],
      })
      .returning();
    return toArticle(row);
  }

  async updateArticle(id: string, patch: Partial<NewArticleInput>): Promise<Article | null> {
    const db = await this.getDbInstance();
    const [row] = await db.update(articles).set({ ...patch, updatedAt: new Date() }).where(eq(articles.id, id)).returning();
    return row ? toArticle(row) : null;
  }

  async getArticle(id: string): Promise<Article | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    return row ? toArticle(row) : null;
  }

  async createTranslation(articleId: string, input: NewTranslationInput): Promise<ArticleTranslation> {
    const db = await this.getDbInstance();
    const [row] = await db.insert(articleTranslations).values({ articleId, ...input }).returning();
    return toTranslation(row);
  }

  async updateTranslation(translationId: string, patch: TranslationPatch): Promise<ArticleTranslation | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .update(articleTranslations)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(articleTranslations.id, translationId))
      .returning();
    return row ? toTranslation(row) : null;
  }

  async getTranslation(translationId: string): Promise<ArticleTranslation | null> {
    const db = await this.getDbInstance();
    const [row] = await db.select().from(articleTranslations).where(eq(articleTranslations.id, translationId)).limit(1);
    return row ? toTranslation(row) : null;
  }

  async getTranslationsForArticle(articleId: string): Promise<ArticleTranslation[]> {
    const db = await this.getDbInstance();
    const rows = await db.select().from(articleTranslations).where(eq(articleTranslations.articleId, articleId));
    return rows.map(toTranslation);
  }

  async slugExists(locale: Locale, slug: string, excludeTranslationId?: string): Promise<boolean> {
    const db = await this.getDbInstance();
    const conditions = [eq(articleTranslations.locale, locale), eq(articleTranslations.slug, slug)];
    if (excludeTranslationId) conditions.push(ne(articleTranslations.id, excludeTranslationId));
    const rows = await db.select({ id: articleTranslations.id }).from(articleTranslations).where(and(...conditions)).limit(1);
    return rows.length > 0;
  }

  async changeSlug(translationId: string, newSlug: string): Promise<ChangeSlugResult> {
    const db = await this.getDbInstance();
    const current = await this.getTranslation(translationId);
    if (!current) return { success: false, error: "not_found" };
    if (current.slug === newSlug) return { success: true, translation: current };

    if (await this.slugExists(current.locale, newSlug, translationId)) {
      return { success: false, error: "slug_taken" };
    }

    // Anti-chain: always point the redirect at the article, never at a
    // slug string — see schema.ts's comment on articleSlugRedirects.
    await db.insert(articleSlugRedirects).values({ locale: current.locale, oldSlug: current.slug, articleId: current.articleId });

    const [row] = await db
      .update(articleTranslations)
      .set({ slug: newSlug, updatedAt: new Date() })
      .where(eq(articleTranslations.id, translationId))
      .returning();
    return { success: true, translation: toTranslation(row) };
  }

  async changeStatus(translationId: string, status: ContentStatus): Promise<ArticleTranslation | null> {
    const db = await this.getDbInstance();
    const current = await this.getTranslation(translationId);
    if (!current) return null;

    const publishedAt = status === "PUBLISHED" && !current.publishedAt ? new Date() : undefined;

    const [row] = await db
      .update(articleTranslations)
      .set({ status, updatedAt: new Date(), ...(publishedAt ? { publishedAt } : {}) })
      .where(eq(articleTranslations.id, translationId))
      .returning();
    return row ? toTranslation(row) : null;
  }

  async findPublishedBySlug(locale: Locale, slug: string): Promise<ArticleWithTranslation | null> {
    const db = await this.getDbInstance();
    const [row] = await db
      .select()
      .from(articleTranslations)
      .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
      .where(and(eq(articleTranslations.locale, locale), eq(articleTranslations.slug, slug), eq(articleTranslations.status, "PUBLISHED")))
      .limit(1);
    if (!row) return null;
    return { ...toArticle(row.articles), translation: toTranslation(row.article_translations) };
  }

  async resolveRedirect(locale: Locale, oldSlug: string): Promise<{ articleId: string; currentSlug: string } | null> {
    const db = await this.getDbInstance();
    const [redirectRow] = await db
      .select()
      .from(articleSlugRedirects)
      .where(and(eq(articleSlugRedirects.locale, locale), eq(articleSlugRedirects.oldSlug, oldSlug)))
      .limit(1);
    if (!redirectRow) return null;

    const [translationRow] = await db
      .select()
      .from(articleTranslations)
      .where(and(eq(articleTranslations.articleId, redirectRow.articleId), eq(articleTranslations.locale, locale), eq(articleTranslations.status, "PUBLISHED")))
      .limit(1);
    if (!translationRow) return null;

    return { articleId: redirectRow.articleId, currentSlug: translationRow.slug };
  }

  async listPublished(locale: Locale, filters: { category?: ArticleCategory }, page: number, pageSize: number) {
    const db = await this.getDbInstance();
    const conditions = [eq(articleTranslations.locale, locale), eq(articleTranslations.status, "PUBLISHED")];
    if (filters.category) conditions.push(eq(articles.category, filters.category));
    const where = and(...conditions);

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(articleTranslations)
        .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
        .where(where)
        .orderBy(desc(articleTranslations.publishedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ value: count() })
        .from(articleTranslations)
        .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
        .where(where),
    ]);

    return {
      items: rows.map((r) => ({ ...toArticle(r.articles), translation: toTranslation(r.article_translations) })),
      total,
    };
  }

  async getFeaturedPublished(locale: Locale, limit: number): Promise<ArticleWithTranslation[]> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(articleTranslations)
      .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
      .where(and(eq(articleTranslations.locale, locale), eq(articleTranslations.status, "PUBLISHED"), eq(articles.featured, true)))
      .orderBy(desc(articleTranslations.publishedAt))
      .limit(limit);
    return rows.map((r) => ({ ...toArticle(r.articles), translation: toTranslation(r.article_translations) }));
  }

  async getRecentPublished(locale: Locale, limit: number, excludeArticleId?: string): Promise<ArticleWithTranslation[]> {
    const db = await this.getDbInstance();
    const conditions = [eq(articleTranslations.locale, locale), eq(articleTranslations.status, "PUBLISHED")];
    if (excludeArticleId) conditions.push(ne(articles.id, excludeArticleId));
    const rows = await db
      .select()
      .from(articleTranslations)
      .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
      .where(and(...conditions))
      .orderBy(desc(articleTranslations.publishedAt))
      .limit(limit);
    return rows.map((r) => ({ ...toArticle(r.articles), translation: toTranslation(r.article_translations) }));
  }

  async listAllPublishedTranslations(): Promise<ArticleWithTranslation[]> {
    const db = await this.getDbInstance();
    const rows = await db
      .select()
      .from(articleTranslations)
      .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
      .where(eq(articleTranslations.status, "PUBLISHED"));
    return rows.map((r) => ({ ...toArticle(r.articles), translation: toTranslation(r.article_translations) }));
  }

  async listForAdmin(filters: AdminArticleListFilters, page: number, pageSize: number) {
    const db = await this.getDbInstance();
    const conditions = [];
    if (filters.status) conditions.push(eq(articleTranslations.status, filters.status));
    if (filters.locale) conditions.push(eq(articleTranslations.locale, filters.locale));
    if (filters.category) conditions.push(eq(articles.category, filters.category));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(ilike(articleTranslations.title, term), ilike(articleTranslations.slug, term)));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(articleTranslations)
        .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
        .where(where)
        .orderBy(desc(articleTranslations.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ value: count() })
        .from(articleTranslations)
        .innerJoin(articles, eq(articleTranslations.articleId, articles.id))
        .where(where),
    ]);

    return {
      items: rows.map((r) => ({ ...toArticle(r.articles), translation: toTranslation(r.article_translations) })),
      total,
    };
  }

  async countByStatus(): Promise<Record<ContentStatus, number>> {
    const db = await this.getDbInstance();
    const rows = await db.select({ status: articleTranslations.status, value: count() }).from(articleTranslations).groupBy(articleTranslations.status);
    const result: Record<ContentStatus, number> = { DRAFT: 0, REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 };
    for (const row of rows) result[row.status as ContentStatus] = row.value;
    return result;
  }
}

let repository: ArticleRepository | null = null;

export function getArticleRepository(): ArticleRepository {
  if (!repository) repository = new DrizzleArticleRepository();
  return repository;
}

export function createTestArticleRepository(getDbInstance: typeof getDb): ArticleRepository {
  return new DrizzleArticleRepository(getDbInstance);
}
