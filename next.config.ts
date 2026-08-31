import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { LEGACY_REDIRECTS } from "./src/config/legacy-redirects";
import { buildLegacyRedirectRules } from "./src/lib/seo/build-redirects";
import { routing } from "./src/i18n/routing";
import { buildSecurityHeaders } from "./src/lib/security/csp";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // See src/config/legacy-redirects.ts for what this is and — right
  // now — why it's empty. Applied per-locale directly (source -> final
  // destination, never a chain) so a redirect never round-trips
  // through next-intl's own locale-prefix redirect first.
  async redirects() {
    return buildLegacyRedirectRules(LEGACY_REDIRECTS, routing.locales);
  },
  // Applied to every route — see src/lib/security/csp.ts for the CSP
  // itself and why it isn't a stricter nonce-based policy yet.
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders() }];
  },
  // @electric-sql/pglite loads a WASM binary and manages its own file
  // paths internally; bundling it (Turbopack rewrites import.meta.url
  // and Node built-in boundaries) breaks its path handling with
  // "Received an instance of URL" errors. Excluding it from bundling
  // and letting Node `require` it directly fixes this — same fix
  // Next.js documents for other native/WASM-backed packages (sharp,
  // better-sqlite3, etc., which ship this by default; pglite doesn't
  // yet, so it's added explicitly here).
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default withNextIntl(nextConfig);
