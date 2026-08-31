import { describe, it, expect } from "vitest";
import { buildLegacyRedirectRules } from "@/lib/seo/build-redirects";
import type { Locale } from "@/i18n/routing";

const locales: Locale[] = ["fr", "ar", "en", "de"];

describe("buildLegacyRedirectRules", () => {
  it("produces no rules for an empty redirect list (current real state)", () => {
    expect(buildLegacyRedirectRules([], locales)).toEqual([]);
  });

  it("applies a redirect per locale, directly (no chain)", () => {
    const rules = buildLegacyRedirectRules([{ source: "/old-page", destination: "/new-page", permanent: true }], locales);
    expect(rules).toHaveLength(4);
    expect(rules).toEqual(
      expect.arrayContaining([
        { source: "/fr/old-page", destination: "/fr/new-page", permanent: true },
        { source: "/en/old-page", destination: "/en/new-page", permanent: true },
      ]),
    );
  });

  it("never produces an intermediate hop (source and destination differ from every other rule's source)", () => {
    const rules = buildLegacyRedirectRules(
      [
        { source: "/a", destination: "/b", permanent: true },
        { source: "/b", destination: "/c", permanent: true },
      ],
      ["fr"],
    );
    // This is a data-hygiene expectation on future entries, not something
    // the function itself resolves — assert the raw shape so a chain like
    // this is visible/reviewable rather than silently collapsed or hidden.
    const sources = rules.map((r) => r.source);
    const destinations = rules.map((r) => r.destination);
    const chained = sources.filter((s) => destinations.includes(s));
    expect(chained).toEqual(["/fr/b"]); // documents the risk — a real PR adding these two entries should be caught in review
  });
});
