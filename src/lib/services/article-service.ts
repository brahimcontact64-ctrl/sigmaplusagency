import {
  getArticleRepository,
  type ArticleRepository,
  type NewArticleInput,
  type NewTranslationInput,
  type TranslationPatch,
} from "@/lib/repositories/article-repository";
import { getAuditLogRepository, type AuditLogRepository } from "@/lib/repositories/audit-log-repository";
import { validateForPublish } from "@/domain/article-validation";
import type { AdminActor } from "@/domain/admin-user";
import type { Article, ArticleTranslation, ContentStatus } from "@/domain/article";

export type CreateArticleResult = { success: true; article: Article; translation: ArticleTranslation } | { success: false; error: "slug_taken" };
export type SaveTranslationResult = { success: true; translation: ArticleTranslation } | { success: false; error: "slug_taken" | "not_found" };
export type PublishResult = { success: true; translation: ArticleTranslation } | { success: false; error: "not_found" | "invalid"; problems?: string[] };

/**
 * Orchestrates the article repository + audit trail. Every mutation
 * takes an explicit `actor` (never reads a session itself — same
 * pattern as crm-service/settings-service, see their module comments)
 * so this stays trivially unit-testable and keeps auth a one-time
 * check at the server-action boundary.
 */
export class ArticleService {
  constructor(
    private readonly repo: ArticleRepository = getArticleRepository(),
    private readonly auditLog: AuditLogRepository = getAuditLogRepository(),
  ) {}

  async createArticleWithTranslation(articleInput: NewArticleInput, translationInput: NewTranslationInput, actor: AdminActor): Promise<CreateArticleResult> {
    if (await this.repo.slugExists(translationInput.locale, translationInput.slug)) {
      return { success: false, error: "slug_taken" };
    }

    const article = await this.repo.createArticle(articleInput);
    const translation = await this.repo.createTranslation(article.id, { ...translationInput, editorEmail: actor.email });

    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_created", targetType: "article", targetId: article.id });

    return { success: true, article, translation };
  }

  /** Adds a new locale's translation to an existing article (the "French exists, Arabic doesn't yet" case). */
  async addTranslation(articleId: string, translationInput: NewTranslationInput, actor: AdminActor): Promise<SaveTranslationResult> {
    if (await this.repo.slugExists(translationInput.locale, translationInput.slug)) {
      return { success: false, error: "slug_taken" };
    }
    const translation = await this.repo.createTranslation(articleId, { ...translationInput, editorEmail: actor.email });
    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_created", targetType: "article_translation", targetId: translation.id });
    return { success: true, translation };
  }

  async saveTranslation(translationId: string, patch: TranslationPatch, actor: AdminActor): Promise<SaveTranslationResult> {
    const current = await this.repo.getTranslation(translationId);
    if (!current) return { success: false, error: "not_found" };

    const updated = await this.repo.updateTranslation(translationId, { ...patch, editorEmail: actor.email });
    if (!updated) return { success: false, error: "not_found" };

    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_updated", targetType: "article_translation", targetId: translationId });
    return { success: true, translation: updated };
  }

  async changeSlug(translationId: string, newSlug: string, actor: AdminActor): Promise<SaveTranslationResult> {
    const result = await this.repo.changeSlug(translationId, newSlug);
    if (!result.success) return result;

    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_slug_changed", targetType: "article_translation", targetId: translationId, metadata: { newSlug } });
    return { success: true, translation: result.translation };
  }

  async publish(translationId: string, actor: AdminActor): Promise<PublishResult> {
    const current = await this.repo.getTranslation(translationId);
    if (!current) return { success: false, error: "not_found" };

    const problems = validateForPublish(current);
    if (problems.length > 0) return { success: false, error: "invalid", problems };

    const translation = await this.repo.changeStatus(translationId, "PUBLISHED");
    if (!translation) return { success: false, error: "not_found" };

    await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_published", targetType: "article_translation", targetId: translationId });
    return { success: true, translation };
  }

  async changeStatus(translationId: string, status: Exclude<ContentStatus, "PUBLISHED">, actor: AdminActor): Promise<PublishResult> {
    const translation = await this.repo.changeStatus(translationId, status);
    if (!translation) return { success: false, error: "not_found" };

    if (status === "ARCHIVED") {
      await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_archived", targetType: "article_translation", targetId: translationId });
    } else {
      await this.auditLog.record({ actorId: actor.id, actorEmail: actor.email, action: "article_updated", targetType: "article_translation", targetId: translationId, metadata: { status } });
    }
    return { success: true, translation };
  }

  getDetail(articleId: string) {
    return this.repo.getArticle(articleId);
  }

  listForAdmin(...args: Parameters<ArticleRepository["listForAdmin"]>) {
    return this.repo.listForAdmin(...args);
  }
}

let service: ArticleService | null = null;

export function getArticleService(): ArticleService {
  if (!service) service = new ArticleService();
  return service;
}
