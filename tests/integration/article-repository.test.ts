import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestArticleRepository, type ArticleRepository } from "@/lib/repositories/article-repository";

let db: AppDatabase;
let repo: ArticleRepository;

beforeAll(async () => {
  db = await createTestDb();
  repo = createTestArticleRepository(async () => db);
});

function translationInput(overrides: Partial<Parameters<ArticleRepository["createTranslation"]>[1]> = {}) {
  return {
    locale: "en" as const,
    slug: `test-slug-${Math.random().toString(36).slice(2, 8)}`,
    title: "Test Article",
    description: "A test article description long enough to be meaningful.",
    excerpt: "A short excerpt.",
    content: "# Hello\n\nSome body content.",
    ...overrides,
  };
}

describe("ArticleRepository — creation and translations", () => {
  it("creates an article and its first translation as DRAFT", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, translationInput());
    expect(translation.status).toBe("DRAFT");
    expect(translation.publishedAt).toBeUndefined();
  });

  it("allows a French translation to exist while Arabic doesn't yet (Phase 8 §9)", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    const fr = await repo.createTranslation(article.id, translationInput({ locale: "fr", slug: "article-fr-only" }));
    await repo.changeStatus(fr.id, "PUBLISHED");

    const translations = await repo.getTranslationsForArticle(article.id);
    expect(translations).toHaveLength(1);
    expect(translations[0]!.locale).toBe("fr");

    const arabic = await repo.findPublishedBySlug("ar", "article-fr-only");
    expect(arabic).toBeNull();
  });

  it("enforces slug uniqueness within a locale", async () => {
    const article1 = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    await repo.createTranslation(article1.id, translationInput({ locale: "en", slug: "shared-slug" }));
    expect(await repo.slugExists("en", "shared-slug")).toBe(true);
    expect(await repo.slugExists("ar", "shared-slug")).toBe(false);
  });
});

describe("ArticleRepository — publish/draft privacy", () => {
  it("never returns a DRAFT/REVIEW/ARCHIVED translation from findPublishedBySlug", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "ai", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, translationInput({ locale: "en", slug: "draft-privacy-test" }));

    expect(await repo.findPublishedBySlug("en", "draft-privacy-test")).toBeNull();

    await repo.changeStatus(translation.id, "REVIEW");
    expect(await repo.findPublishedBySlug("en", "draft-privacy-test")).toBeNull();

    await repo.changeStatus(translation.id, "PUBLISHED");
    expect(await repo.findPublishedBySlug("en", "draft-privacy-test")).not.toBeNull();

    await repo.changeStatus(translation.id, "ARCHIVED");
    expect(await repo.findPublishedBySlug("en", "draft-privacy-test")).toBeNull();
  });

  it("sets publishedAt exactly once, on first publish, and preserves it across unpublish/republish", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "ai", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, translationInput({ locale: "en", slug: "publish-once-test" }));

    const published = await repo.changeStatus(translation.id, "PUBLISHED");
    const firstPublishedAt = published!.publishedAt;
    expect(firstPublishedAt).toBeInstanceOf(Date);

    await repo.changeStatus(translation.id, "DRAFT");
    const republished = await repo.changeStatus(translation.id, "PUBLISHED");
    expect(republished!.publishedAt?.getTime()).toBe(firstPublishedAt!.getTime());
  });
});

describe("ArticleRepository — slug change and redirect history (anti-chain)", () => {
  it("creates a redirect from the old slug to the article, resolving to the CURRENT slug", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "seo", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, translationInput({ locale: "en", slug: "old-a" }));
    await repo.changeStatus(translation.id, "PUBLISHED");

    await repo.changeSlug(translation.id, "new-b");
    await repo.changeSlug(translation.id, "new-c");

    // A -> B -> C should resolve old-a directly to new-c, not to the stale "new-b".
    const resolved = await repo.resolveRedirect("en", "old-a");
    expect(resolved?.currentSlug).toBe("new-c");

    const resolvedB = await repo.resolveRedirect("en", "new-b");
    expect(resolvedB?.currentSlug).toBe("new-c");
  });

  it("does not resolve a redirect to an article that's no longer published", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "seo", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, translationInput({ locale: "en", slug: "unpub-old" }));
    await repo.changeStatus(translation.id, "PUBLISHED");
    await repo.changeSlug(translation.id, "unpub-new");
    await repo.changeStatus(translation.id, "ARCHIVED");

    expect(await repo.resolveRedirect("en", "unpub-old")).toBeNull();
  });

  it("rejects a slug change to one already taken in the same locale", async () => {
    const article1 = await repo.createArticle({ type: "ARTICLE", category: "seo", author: "SIGMA+" });
    await repo.createTranslation(article1.id, translationInput({ locale: "en", slug: "taken-slug" }));
    const article2 = await repo.createArticle({ type: "ARTICLE", category: "seo", author: "SIGMA+" });
    const t2 = await repo.createTranslation(article2.id, translationInput({ locale: "en", slug: "free-slug" }));

    const result = await repo.changeSlug(t2.id, "taken-slug");
    expect(result).toEqual({ success: false, error: "slug_taken" });
  });
});

describe("ArticleRepository — admin listing and counts", () => {
  it("filters the admin list by status", async () => {
    const article = await repo.createArticle({ type: "GUIDE", category: "automation", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, translationInput({ locale: "de", slug: "guide-de-filter-test" }));
    await repo.changeStatus(translation.id, "REVIEW");

    const { items } = await repo.listForAdmin({ status: "REVIEW" }, 1, 50);
    expect(items.some((i) => i.translation.id === translation.id)).toBe(true);
    expect(items.every((i) => i.translation.status === "REVIEW")).toBe(true);
  });

  it("countByStatus reflects real counts", async () => {
    const before = await repo.countByStatus();
    const article = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    await repo.createTranslation(article.id, translationInput({ locale: "en", slug: `count-test-${Date.now()}` }));
    const after = await repo.countByStatus();
    expect(after.DRAFT).toBe(before.DRAFT + 1);
  });
});
