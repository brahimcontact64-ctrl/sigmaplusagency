import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestArticleRepository, type ArticleRepository } from "@/lib/repositories/article-repository";
import { articleEntries } from "@/app/sitemap";
import { siteConfig } from "@/lib/site-config";

let db: AppDatabase;
let repo: ArticleRepository;

beforeAll(async () => {
  db = await createTestDb();
  repo = createTestArticleRepository(async () => db);
});

describe("articleEntries — sitemap inclusion", () => {
  it("includes a published article with its real updatedAt as lastModified", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    const translation = await repo.createTranslation(article.id, {
      locale: "en",
      slug: "sitemap-inclusion-test",
      title: "Sitemap Inclusion Test",
      description: "d",
      excerpt: "e",
      content: "c",
    });
    await repo.changeStatus(translation.id, "PUBLISHED");

    const entries = await articleEntries(repo);
    const entry = entries.find((e) => e.url.includes("sitemap-inclusion-test"));
    expect(entry).toBeDefined();
    expect(entry!.lastModified).toBeInstanceOf(Date);
    expect(entry!.url).toBe(`${siteConfig.url}/en/insights/sitemap-inclusion-test`);
  });

  it("never includes a DRAFT translation", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    await repo.createTranslation(article.id, {
      locale: "en",
      slug: "sitemap-draft-exclusion-test",
      title: "Draft",
      description: "d",
      excerpt: "e",
      content: "c",
    });

    const entries = await articleEntries(repo);
    expect(entries.some((e) => e.url.includes("sitemap-draft-exclusion-test"))).toBe(false);
  });

  it("only declares hreflang alternates for locales actually published (never a fabricated route)", async () => {
    const article = await repo.createArticle({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    const en = await repo.createTranslation(article.id, {
      locale: "en",
      slug: "partial-translation-test",
      title: "Partial",
      description: "d",
      excerpt: "e",
      content: "c",
    });
    await repo.changeStatus(en.id, "PUBLISHED");
    // Arabic translation deliberately never created for this article.

    const entries = await articleEntries(repo);
    const entry = entries.find((e) => e.url.includes("partial-translation-test"));
    expect(entry).toBeDefined();
    const languages = entry!.alternates!.languages as Record<string, string>;
    expect(languages.en).toBeDefined();
    expect(languages.ar).toBeUndefined();
  });

  it("degrades to an empty list rather than throwing if the repository fails", async () => {
    const brokenRepo: ArticleRepository = {
      ...repo,
      listAllPublishedTranslations: async () => {
        throw new Error("simulated DB failure");
      },
    };
    const entries = await articleEntries(brokenRepo);
    expect(entries).toEqual([]);
  });
});
