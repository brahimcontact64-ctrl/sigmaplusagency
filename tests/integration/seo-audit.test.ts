import { describe, it, expect } from "vitest";
import { runSeoAudit, collectKeyPaths } from "@/lib/seo/audit";

describe("runSeoAudit", () => {
  // runSeoAudit() reads published articles through the real repository
  // singleton (Phase 8) — in this test run that's an empty/fresh dev
  // PGlite instance (CI always starts from a clean checkout; `.data/`
  // is gitignored), so these assertions hold for the static content
  // either way. A local machine with manually-created dev articles
  // could in principle change these results — a known, accepted
  // limitation rather than a full DI plumb-through for a CLI-style
  // audit that's supposed to inspect real content anyway.
  it("produces zero ERROR-severity findings against the real site content", async () => {
    const issues = await runSeoAudit();
    const errors = issues.filter((i) => i.type === "ERROR");
    expect(errors).toEqual([]);
  });

  it("every finding is INTERNAL_AUDIT provenance with a real recommendation", async () => {
    const issues = await runSeoAudit();
    for (const issue of issues) {
      expect(issue.source).toBe("INTERNAL_AUDIT");
      expect(issue.recommendation.length).toBeGreaterThan(0);
      expect(issue.detectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("does not flag any current page as missing an <h1> (every page composes PageHero or HeroSection)", async () => {
    const issues = await runSeoAudit();
    const missingH1 = issues.filter((i) => i.message.includes("No <h1>"));
    expect(missingH1).toEqual([]);
  });
});

describe("collectKeyPaths", () => {
  it("collects nested leaf key paths only", () => {
    const keys = collectKeyPaths({ a: { b: "x", c: "y" }, d: "z" });
    expect(keys).toEqual(new Set(["a.b", "a.c", "d"]));
  });

  it("treats an array as a single leaf, not individually-indexed keys", () => {
    const keys = collectKeyPaths({ items: ["one", "two"] });
    expect(keys).toEqual(new Set(["items"]));
  });

  it("detects an asymmetric key missing from one side", () => {
    const a = collectKeyPaths({ nav: { home: "Home", services: "Services" } });
    const b = collectKeyPaths({ nav: { home: "Home" } });
    const missingFromB = [...a].filter((k) => !b.has(k));
    expect(missingFromB).toEqual(["nav.services"]);
  });
});
