import { describe, it, expect } from "vitest";
import { articleCreateSchema, translationDraftSchema, validateForPublish } from "@/domain/article-validation";

describe("articleCreateSchema", () => {
  it("accepts a minimal valid article", () => {
    const result = articleCreateSchema.safeParse({ type: "ARTICLE", category: "web", author: "SIGMA+" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown category", () => {
    const result = articleCreateSchema.safeParse({ type: "ARTICLE", category: "not-a-category", author: "SIGMA+" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown related service id", () => {
    const result = articleCreateSchema.safeParse({ type: "ARTICLE", category: "web", author: "SIGMA+", relatedServices: ["not-a-real-service"] });
    expect(result.success).toBe(false);
  });

  it("rejects an unexpected field (strict mode)", () => {
    const result = articleCreateSchema.safeParse({ type: "ARTICLE", category: "web", author: "SIGMA+", extra: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("translationDraftSchema", () => {
  it("accepts a valid draft", () => {
    const result = translationDraftSchema.safeParse({
      locale: "en",
      slug: "how-to-plan-a-website",
      title: "How to plan a website",
      description: "A guide.",
      excerpt: "Short version.",
      content: "Body.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid locale", () => {
    const result = translationDraftSchema.safeParse({ locale: "xx", slug: "a", title: "", description: "", excerpt: "", content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with uppercase or spaces", () => {
    const result = translationDraftSchema.safeParse({ locale: "en", slug: "Not A Valid Slug!", title: "", description: "", excerpt: "", content: "" });
    expect(result.success).toBe(false);
  });
});

describe("validateForPublish", () => {
  it("blocks publishing with empty title/description/content/slug", () => {
    const problems = validateForPublish({ title: "", description: "", content: "", slug: "" });
    expect(problems.length).toBe(4);
  });

  it("does not require a minimum SEO character count to publish (warnings only, not hard blockers)", () => {
    const problems = validateForPublish({ title: "Hi", description: "Short.", content: "x", slug: "hi" });
    expect(problems).toEqual([]);
  });
});
