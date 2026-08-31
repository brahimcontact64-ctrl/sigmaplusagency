import { describe, it, expect } from "vitest";
import { sanitizeUrl } from "@/lib/content/sanitize-url";

describe("ArticleBody url sanitization — Phase 8 §64", () => {
  it("allows http/https URLs", () => {
    expect(sanitizeUrl("https://example.com/page")).toBe("https://example.com/page");
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("allows internal relative links", () => {
    expect(sanitizeUrl("/en/services/web-development")).toBe("/en/services/web-development");
  });

  it("allows mailto and tel links", () => {
    expect(sanitizeUrl("mailto:hello@sigmaplus.agency")).toBe("mailto:hello@sigmaplus.agency");
    expect(sanitizeUrl("tel:+213550475248")).toBe("tel:+213550475248");
  });

  it("blocks a javascript: URL", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("blocks a data: URL", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("blocks a vbscript: URL", () => {
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("");
  });
});
