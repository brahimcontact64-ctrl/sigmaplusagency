import { describe, it, expect } from "vitest";
import { buildSecurityHeaders } from "@/lib/security/csp";

function getHeader(headers: { key: string; value: string }[], key: string): string | undefined {
  return headers.find((h) => h.key === key)?.value;
}

describe("buildSecurityHeaders", () => {
  it("includes a Content-Security-Policy with the expected restrictive directives", () => {
    const csp = getHeader(buildSecurityHeaders(), "Content-Security-Policy")!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("never allows a broad https: wildcard for images (no external image usage in this app)", () => {
    const csp = getHeader(buildSecurityHeaders(), "Content-Security-Policy")!;
    const imgSrc = csp.split(";").find((d) => d.trim().startsWith("img-src"));
    expect(imgSrc).not.toContain("https:");
  });

  it("never weakens any directive with a bare wildcard", () => {
    const csp = getHeader(buildSecurityHeaders(), "Content-Security-Policy")!;
    for (const directive of csp.split(";")) {
      const values = directive.trim().split(/\s+/).slice(1);
      expect(values).not.toContain("*");
    }
  });

  it("sets the other expected security headers", () => {
    const headers = buildSecurityHeaders();
    expect(getHeader(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(getHeader(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(getHeader(headers, "Permissions-Policy")).toContain("camera=()");
    expect(getHeader(headers, "Strict-Transport-Security")).toContain("max-age=");
  });

  it("does not include GA4 hosts when NEXT_PUBLIC_GA4_MEASUREMENT_ID is unset", () => {
    const csp = getHeader(buildSecurityHeaders(), "Content-Security-Policy")!;
    expect(csp).not.toContain("googletagmanager.com");
  });
});
