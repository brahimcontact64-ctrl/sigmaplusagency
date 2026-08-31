import { describe, it, expect } from "vitest";
import { buildCanonicalUrl, buildAlternateLanguages, buildFixedPathAlternates, X_DEFAULT_LOCALE } from "@/lib/seo/site-url";
import { siteConfig } from "@/lib/site-config";
import { routing } from "@/i18n/routing";

describe("buildCanonicalUrl", () => {
  it("builds a locale-prefixed URL under the configured production origin", () => {
    expect(buildCanonicalUrl("fr", "/services")).toBe(`${siteConfig.url}/fr/services`);
  });

  it("never points at localhost", () => {
    expect(buildCanonicalUrl("en", "/contact")).not.toContain("localhost");
  });

  it("defaults to the bare locale root when no path is given", () => {
    expect(buildCanonicalUrl("de")).toBe(`${siteConfig.url}/de`);
  });

  it("never includes a query string", () => {
    expect(buildCanonicalUrl("en", "/start-project")).not.toContain("?");
  });
});

describe("buildAlternateLanguages", () => {
  it("includes every configured locale plus x-default", () => {
    const pathByLocale = Object.fromEntries(routing.locales.map((l) => [l, "/about"])) as Record<(typeof routing.locales)[number], string>;
    const languages = buildAlternateLanguages(pathByLocale);

    for (const locale of routing.locales) {
      expect(languages[locale]).toBe(`${siteConfig.url}/${locale}/about`);
    }
    expect(languages["x-default"]).toBe(`${siteConfig.url}/${X_DEFAULT_LOCALE}/about`);
  });

  it("uses the correct per-locale slug, not a shared one", () => {
    const languages = buildAlternateLanguages({ fr: "/services/developpement-web", ar: "/services/تطوير-الويب", en: "/services/web-development", de: "/services/web-entwicklung" });
    expect(languages.fr).toContain("/fr/services/developpement-web");
    expect(languages.en).toContain("/en/services/web-development");
    expect(languages.fr).not.toContain("web-development");
  });
});

describe("buildFixedPathAlternates", () => {
  it("uses the same path for every locale", () => {
    const { canonical, languages } = buildFixedPathAlternates("en", "/contact");
    expect(canonical).toBe(`${siteConfig.url}/en/contact`);
    for (const locale of routing.locales) {
      expect(languages[locale]).toBe(`${siteConfig.url}/${locale}/contact`);
    }
  });
});
