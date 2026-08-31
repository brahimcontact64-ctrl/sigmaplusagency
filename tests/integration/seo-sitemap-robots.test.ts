import { describe, it, expect, afterEach } from "vitest";
import { buildStaticSitemapEntries as sitemap } from "@/app/sitemap";
import robots from "@/app/robots";
import { siteConfig } from "@/lib/site-config";

describe("sitemap", () => {
  const entries = sitemap();

  it("includes the homepage and every top-level fixed page", () => {
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u === `${siteConfig.url}/fr`)).toBe(true);
    for (const segment of ["services", "work", "about", "contact", "start-project", "ai-consultant"]) {
      expect(urls.some((u) => u.endsWith(`/fr/${segment}`))).toBe(true);
    }
  });

  it("never includes an admin, API, or draft-content URL", () => {
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
  });

  it("never fabricates a lastModified timestamp", () => {
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });

  it("every entry declares alternates for all 4 locales", () => {
    for (const e of entries) {
      const languages = e.alternates?.languages;
      expect(languages).toBeDefined();
      expect(Object.keys(languages!)).toEqual(expect.arrayContaining(["fr", "ar", "en", "de"]));
    }
  });

  it("produces no duplicate URLs", () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("robots — production deployment", () => {
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
  });

  function robotsAsProduction() {
    process.env.VERCEL_ENV = "production";
    return robots();
  }

  it("points at the real sitemap", () => {
    expect(robotsAsProduction().sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
  });

  it("disallows admin and API surfaces", () => {
    const rule = Array.isArray(robotsAsProduction().rules) ? (robotsAsProduction().rules as unknown[])[0] : robotsAsProduction().rules;
    expect((rule as { disallow: string[] }).disallow).toEqual(expect.arrayContaining(["/admin", "/api/"]));
  });

  it("allows general crawling", () => {
    const result = robotsAsProduction();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect((rule as { allow: string }).allow).toBe("/");
  });
});

describe("robots — preview/development deployment (Phase 10 §9)", () => {
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
  });

  it("disallows everything and omits the sitemap reference", () => {
    process.env.VERCEL_ENV = "preview";
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect((rule as { disallow: string }).disallow).toBe("/");
    expect(result.sitemap).toBeUndefined();
  });
});
