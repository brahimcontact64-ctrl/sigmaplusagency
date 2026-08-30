import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
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
