/**
 * Production security headers (Phase 9 §44) — a pragmatic, maintainable
 * CSP rather than a maximally strict nonce-based one. Next.js itself
 * relies on inline bootstrap scripts/styles in the App Router, and
 * this stack has no build step that threads a per-request nonce
 * through every `<script>`/`<style>` tag yet, so `'unsafe-inline'` is
 * kept here deliberately rather than shipping a CSP that silently
 * breaks the app. Documented remaining tightening: move to
 * nonce/hash-based `script-src`/`style-src` once a nonce plumbing
 * exists (see docs/PRODUCTION_OPERATIONS.md).
 *
 * next/font self-hosts Google Fonts at build time (served from this
 * origin), so no fonts.googleapis.com/fonts.gstatic.com allowance is
 * needed here despite `Geist`/`Geist_Mono` coming from next/font/google.
 */
const GA4_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);

const GA4_SCRIPT_HOSTS = GA4_CONFIGURED ? ["https://www.googletagmanager.com"] : [];
const GA4_CONNECT_HOSTS = GA4_CONFIGURED ? ["https://www.google-analytics.com", "https://www.googletagmanager.com"] : [];

function buildCsp(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...GA4_SCRIPT_HOSTS],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...GA4_CONNECT_HOSTS],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
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
