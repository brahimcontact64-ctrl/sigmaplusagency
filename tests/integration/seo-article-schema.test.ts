import { describe, it, expect } from "vitest";
import { buildArticleSchema, organizationId } from "@/lib/seo/schema";

describe("buildArticleSchema — real values only", () => {
  it("uses the real publishedAt/updatedAt timestamps, never a fabricated date", () => {
    const published = new Date("2026-01-15T10:00:00Z");
    const updated = new Date("2026-02-01T10:00:00Z");
    const schema = buildArticleSchema({ headline: "H", description: "D", url: "https://x/en/insights/h", datePublished: published, dateModified: updated });
    expect(schema.datePublished).toBe(published.toISOString());
    expect(schema.dateModified).toBe(updated.toISOString());
  });

  it("omits datePublished entirely for a not-yet-published article rather than guessing a date", () => {
    const schema = buildArticleSchema({ headline: "H", description: "D", url: "https://x/en/insights/h", dateModified: new Date() });
    expect(schema).not.toHaveProperty("datePublished");
  });

  it("author and publisher both reference the one Organization entity — no invented staff writer", () => {
    const schema = buildArticleSchema({ headline: "H", description: "D", url: "https://x/en/insights/h", dateModified: new Date() });
    expect(schema.author).toEqual({ "@id": organizationId() });
    expect(schema.publisher).toEqual({ "@id": organizationId() });
  });

  it("omits image entirely rather than pointing at a placeholder", () => {
    const schema = buildArticleSchema({ headline: "H", description: "D", url: "https://x/en/insights/h", dateModified: new Date() });
    expect(schema).not.toHaveProperty("image");
  });

  it("includes image only when a real one was provided", () => {
    const schema = buildArticleSchema({ headline: "H", description: "D", url: "https://x/en/insights/h", dateModified: new Date(), image: "https://x/og.png" });
    expect(schema.image).toBe("https://x/og.png");
  });
});
