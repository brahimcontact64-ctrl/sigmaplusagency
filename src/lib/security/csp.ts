/**
 * Production security headers. A pragmatic, maintainable CSP rather
 * than a maximally strict nonce-based one — evaluated properly in
 * Phase 10 §21, not just carried forward unexamined:
 *
 * Nonce-based `script-src`/`style-src` (Next's documented pattern —
 * see node_modules/next/dist/docs/.../content-security-policy.md)
 * requires **every page to render dynamically** — Next only injects a
 * nonce into framework/page scripts during server-side rendering of an
 * actual request, never into a statically-generated page (there is no
 * request to read a nonce from at build time). This app deliberately
 * statically generates the entire public marketing site (home,
 * services, work, about, contact, across all 4 locales) for real SEO/
 * performance reasons established since Phase 1-3. Forcing all of that
 * to dynamic rendering to get a nonce would be a major, regressive
 * architecture change (slower loads, no CDN caching, higher hosting
 * cost) — a much bigger trade than a "security hardening" phase should
 * make silently. The experimental hash-based alternative (Subresource
 * Integrity, `experimental.sri`) preserves static generation but only
 * hashes `<script>`/`<link>` tags, not inline `style="..."` attributes
 * (which this codebase uses, e.g. `bar-row.tsx`'s dynamic width) — an
 * SRI-only `style-src` would break those without a separate inline-
 * style audit first, which is out of scope for this phase.
 *
 * So: `'unsafe-inline'` stays, deliberately, on both `script-src` and
 * `style-src`. Documented remaining tightening, in priority order,
 * for whenever it's worth the trade: (1) audit + remove inline
 * `style={{...}}` usage in favor of CSS classes, then drop
 * `'unsafe-inline'` from `style-src`; (2) adopt nonce-based
 * `script-src` only if/when the marketing site's static generation is
 * ever reconsidered for other reasons.
 *
 * What IS tightened without that trade-off: `img-src` has no broad
 * `https:` scheme wildcard — this codebase has zero `<img>`/external
 * image usage anywhere (every visual is procedural SVG/Three.js/CSS,
 * confirmed by a full source grep), so there's nothing that needs it.
 * `next/font` self-hosts Google Fonts at build time (served from this
 * origin), so no fonts.googleapis.com/fonts.gstatic.com allowance is
 * needed despite using `Geist`/`Geist_Mono` from `next/font/google`.
 */
const GA4_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const GA4_SCRIPT_HOSTS = GA4_CONFIGURED ? ["https://www.googletagmanager.com"] : [];
const GA4_CONNECT_HOSTS = GA4_CONFIGURED ? ["https://www.google-analytics.com", "https://www.googletagmanager.com"] : [];

function buildCsp(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' only outside production — React uses eval() in
    // development to reconstruct server-side error stacks in the
    // browser console; neither React nor Next use it in a production
    // build. Matches Next's own documented CSP guidance.
    "script-src": ["'self'", "'unsafe-inline'", ...(IS_PRODUCTION ? [] : ["'unsafe-eval'"]), ...GA4_SCRIPT_HOSTS],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...GA4_CONNECT_HOSTS],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, values]) => (values.length > 0 ? `${key} ${values.join(" ")}` : key))
    .join("; ");
}

export function buildSecurityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: buildCsp() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    // Browsers ignore this over plain HTTP, so it's safe to always send —
    // real effect only kicks in once the production deploy serves HTTPS.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ];
}
