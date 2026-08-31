const SAFE_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/**
 * Pure URL allowlist check, deliberately free of any `next-intl`/
 * `next/navigation` import — `article-body.tsx` (which uses this)
 * pulls in `@/i18n/navigation`'s client `Link`, which breaks outside
 * Next's own bundler in Vitest, the same gotcha as `server-only`
 * modules. Split out so the actual sanitization rule stays directly
 * unit-testable (see rbac.ts/jwt.ts/model-config.ts for the same
 * pattern in earlier phases).
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://sigmaplus.agency");
    if (SAFE_URL_SCHEMES.includes(parsed.protocol)) return url;
    return "";
  } catch {
    // Relative URLs (internal links like "/en/services/web-development") throw on parse without a base — allow them.
    return url.startsWith("/") ? url : "";
  }
}
