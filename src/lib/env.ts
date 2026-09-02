/**
 * Centralized environment variable inventory (Phase 9 §50) — the
 * single place that knows every variable this app reads, so parsing
 * doesn't stay scattered across every module that happens to need one.
 * This module never prints or returns a variable's actual value for a
 * `secret` one — only presence/absence — so it's safe to run from a
 * build log or a support script without ever leaking a credential.
 *
 * This is documentation-plus-validation, not a replacement for the
 * fail-fast checks that already exist at the actual point of use
 * (`db/client.ts` throws immediately if `DATABASE_URL` is missing in
 * production; `session.ts` does the same for `ADMIN_SESSION_SECRET`) —
 * those stay exactly as they are. This module exists so `npm run
 * validate:env` can give one honest picture of what's configured
 * before a deploy, without duplicating or overriding that logic.
 */
export type EnvCategory = "required-production" | "optional-integration" | "public" | "secret";

export type EnvVarSpec = {
  name: string;
  category: EnvCategory;
  description: string;
};

export const ENV_VARS: EnvVarSpec[] = [
  { name: "DATABASE_URL", category: "required-production", description: "PostgreSQL connection string. Missing in production → the app throws at startup (see db/client.ts) rather than falling back to an embedded database." },
  { name: "ADMIN_SESSION_SECRET", category: "required-production", description: "Signs the admin session cookie. Missing in production → the app throws at startup (see session.ts) rather than using a shared/default key." },

  { name: "ANTHROPIC_API_KEY", category: "optional-integration", description: "Enables SIGMA AI. Missing → the AI Consultant shows an honest 'temporarily unavailable' state; the rest of the site is unaffected." },
  { name: "AI_MODEL", category: "optional-integration", description: "Overrides the AI model (must be in SUPPORTED_AI_MODELS). Unset → defaults to claude-sonnet-5." },
  { name: "GOOGLE_SEARCH_CONSOLE_SITE_URL", category: "optional-integration", description: "GSC integration. Missing → Admin SEO shows NOT_CONFIGURED." },
  { name: "GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON", category: "optional-integration", description: "GSC service account credentials (JSON). Never logged." },
  { name: "GA4_PROPERTY_ID", category: "optional-integration", description: "GA4 *reporting* (inbound) integration. Missing → Admin SEO shows NOT_CONFIGURED." },
  { name: "GA4_SERVICE_ACCOUNT_CREDENTIALS_JSON", category: "optional-integration", description: "GA4 reporting service account credentials (JSON). Never logged." },
  { name: "PAGESPEED_API_KEY", category: "optional-integration", description: "PageSpeed Insights integration. Missing → Admin SEO shows NOT_CONFIGURED." },
  { name: "SERP_PROVIDER", category: "optional-integration", description: "Phase 12 keyword/SERP provider selector. Missing or \"NONE\" → the keyword-analysis job honestly reports NOT_CONFIGURED; no vendor is hardwired into the app." },
  { name: "SERP_API_KEY", category: "optional-integration", description: "Paired with SERP_PROVIDER. Never logged." },
  { name: "CRON_SECRET", category: "optional-integration", description: "Phase 12 — authorizes GET/POST requests to /api/internal/seo/run (Authorization: Bearer <value>). Missing → the endpoint rejects every request (fails closed, never open) rather than the app failing to start; set this before activating any cron entry." },
  { name: "PGLITE_DATA_DIR", category: "optional-integration", description: "Local-dev-only override for the embedded Postgres data directory. Ignored in production." },
  { name: "DATABASE_POOL_MAX", category: "optional-integration", description: "postgres-js connection pool size (Phase 10 §2). Defaults to 5. Serverless deployments should lower this (e.g. 1) and rely on a real pooler in front of Postgres." },
  { name: "UPSTASH_REDIS_REST_URL", category: "optional-integration", description: "Distributed rate limiting (Phase 10 §19). Missing → falls back to per-instance in-memory rate limiting (fine for a single-instance deploy; logs a warning in production)." },
  { name: "UPSTASH_REDIS_REST_TOKEN", category: "optional-integration", description: "Paired with UPSTASH_REDIS_REST_URL. Never logged." },
  { name: "RESEND_API_KEY", category: "optional-integration", description: "Lead-notification email (Phase 10 §13). Missing → notifications are skipped; lead persistence is unaffected." },
  { name: "LEAD_NOTIFICATION_EMAIL", category: "optional-integration", description: "Internal inbox that receives new-lead notification emails. Required (alongside RESEND_API_KEY) for internal notifications to actually send." },
  { name: "LEAD_NOTIFICATION_FROM_EMAIL", category: "optional-integration", description: "Verified sender address/domain for outbound notification email. Never a fabricated/unverified From address." },
  { name: "NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL", category: "public", description: "Feature flag (Phase 10 §15/§31) — client confirmation emails stay off until explicitly enabled, even if the email provider is configured." },
  { name: "MAINTENANCE_MODE", category: "public", description: "Feature flag (Phase 10 §30) — when \"true\", disables new lead submissions and AI consultation while the rest of the site (and Admin) keeps working." },

  { name: "NEXT_PUBLIC_SITE_URL", category: "public", description: "Canonical site origin, used for sitemap/canonical/OG URLs." },
  { name: "NEXT_PUBLIC_CONTACT_EMAIL", category: "public", description: "Displayed contact email." },
  { name: "NEXT_PUBLIC_CONTACT_PHONE", category: "public", description: "Displayed contact phone number." },
  { name: "NEXT_PUBLIC_WHATSAPP_NUMBER", category: "public", description: "WhatsApp handoff number used to build wa.me links." },
  { name: "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", category: "public", description: "Optional Search Console HTML verification token." },
  { name: "NEXT_PUBLIC_GA4_MEASUREMENT_ID", category: "public", description: "Enables the optional GA4 *outbound* client script (Phase 9 §28), gated by analytics consent. Missing → no GA4 script loads at all." },

  { name: "VERCEL_ENV", category: "secret", description: "Platform-set deployment environment (production/preview/development) — not a credential, but not something app code should ever need to set manually." },
  { name: "NODE_ENV", category: "secret", description: "Standard Node environment flag, set by the runtime/build tooling." },
];

/** Required-production vars that are currently unset — meaningful only when actually running in production. */
export function getMissingRequiredProductionVars(): string[] {
  return ENV_VARS.filter((v) => v.category === "required-production" && !process.env[v.name]).map((v) => v.name);
}

export type EnvPresenceReport = { name: string; category: EnvCategory; present: boolean };

/** Presence-only report — never includes a value, so this is safe to log/print in full, even for `secret`/optional-integration entries. */
export function buildEnvPresenceReport(): EnvPresenceReport[] {
  return ENV_VARS.map((v) => ({ name: v.name, category: v.category, present: Boolean(process.env[v.name]) }));
}
