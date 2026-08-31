import { describe, it, expect } from "vitest";
import { buildSiteModel } from "@/lib/seo/site-model";
import { routing } from "@/i18n/routing";
import { getAllServiceIds } from "@/content/services";
import { getAllProjectIds } from "@/content/case-studies";

describe("buildSiteModel", () => {
  const pages = buildSiteModel();

  it("includes every locale for every fixed page and content entry", () => {
    const expectedFixedPages = 7; // home + services-index + work-index + about + contact + start-project + ai-consultant
    const expectedPerLocale = expectedFixedPages + getAllServiceIds().length + getAllProjectIds().length;
    expect(pages.length).toBe(expectedPerLocale * routing.locales.length);
  });

  it("every page has a non-empty title, description, and locale-prefixed path", () => {
    for (const page of pages) {
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.description.length).toBeGreaterThan(0);
      expect(page.path.startsWith(`/${page.locale}`)).toBe(true);
    }
  });

  it("marks every modeled page indexable (admin/private routes are never in this model)", () => {
    expect(pages.every((p) => p.indexable)).toBe(true);
  });

  it("produces a unique path per page (no accidental slug collisions)", () => {
    const paths = pages.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
