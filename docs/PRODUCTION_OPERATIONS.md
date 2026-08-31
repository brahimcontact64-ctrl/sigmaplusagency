# SIGMA+ Production Operations

Status: living document, established in Phase 9, extended in Phase 10 (deployment readiness, email notifications, distributed rate limiting, feature flags). Updated whenever the observability/deployment architecture changes materially.

This document covers health checks, logging, the error taxonomy, deployment/migration procedure, backup expectations, environment requirements, rate-limit scaling, and basic incident/rollback guidance. Where this document and code disagree, the code is current.

---

## 1. Health and readiness

- `GET /api/health` — liveness only. Returns `{ status: "ok", version, timestamp }`. Never returns env vars, DB credentials, stack traces, or infrastructure details. Use this for "is the process up" checks (e.g. a platform's basic health probe).
- `GET /api/health/ready` — readiness. Runs a trivial `select 1` against the database, cached for 5 seconds (`src/app/api/health/ready/route.ts`) so repeated/aggressive polling can't turn this into a way to hammer the database. Returns HTTP 200 `{status:"ready"}` or 503 `{status:"not_ready"}`.

Neither endpoint requires authentication (by design — a load balancer/uptime monitor needs to reach them without credentials) and neither leaks anything sensitive.

Admin → Dashboard additionally shows a small **integration health strip** (`src/lib/observability/integration-health.ts`): Database (real `select 1`), AI provider (configuration presence, not a live paid API call), and first-party Analytics (mirrors DB health, since it has no external credential of its own). States are `HEALTHY` / `DEGRADED` / `NOT_CONFIGURED` / `ERROR` — never shown as healthy without a real check, and never an expensive call on every dashboard load.

Admin → SEO already shows GSC/GA4-reporting/PageSpeed connection state (Phase 7/8) — that page is the home for those three; it isn't duplicated here.

## 2. Structured logging

`src/lib/observability/logger.ts` — every entry is one JSON line to `console.*` (DEBUG/INFO/WARN/ERROR), which every major hosting platform (Vercel, Railway, etc.) already captures and can index without a separate logging service. An entry may contain `event`, `component`, `errorCode`, `correlationId`, and other already-vetted safe identifiers — **never** passwords, JWTs, API keys, OAuth tokens, contact messages, or raw AI conversation text. A defense-in-depth key-pattern redactor (`REDACTED_KEY_PATTERN`) additionally strips the value of any field whose *name* looks like a secret (`password`, `token`, `secret`, `apiKey`, `authorization`, `jwt`, `cookie`), regardless of who logged it. Proven by `tests/integration/observability-logger.test.ts`.

`src/lib/observability/error-reporter.ts` — a small `ErrorReporter` interface, Sentry-ready (or any similar provider) without adding a dependency merely to tick a box. The default implementation logs via the structured logger above and returns a random correlation id safe to show a user ("reference this ID if you contact support") — never a raw database UUID, never the error message itself.

## 3. Error taxonomy

`src/domain/error-codes.ts` — a stable, internal set of codes (`DB_UNAVAILABLE`, `AUTH_INVALID`, `AUTH_FORBIDDEN`, `AI_PROVIDER_UNAVAILABLE`, `AI_RATE_LIMITED`, `ANALYTICS_PROVIDER_FAILED`, `SEO_SYNC_FAILED`, `LEAD_PERSISTENCE_FAILED`, `VALIDATION_FAILED`, `RATE_LIMITED`, `NOT_FOUND`, `UNEXPECTED`). These are for logs and internal admin surfaces; user-facing messages stay friendly and localized and never expose a raw code or a stack trace. Adding a new failure mode means adding a code here, not inventing a fresh string inline at the call site.

## 4. Security headers / CSP

`src/lib/security/csp.ts`, wired via `next.config.ts`'s `headers()`. A pragmatic, maintainable policy rather than a maximally strict nonce-based one:

- `Content-Security-Policy` — `default-src 'self'`, `script-src`/`style-src` include `'unsafe-inline'` because Next's App Router relies on inline bootstrap scripts/styles and this stack has no nonce-plumbing yet; `frame-ancestors 'none'`; `object-src 'none'`. GA4 hosts are added to `script-src`/`connect-src` only when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation/interest-cohort all denied), `Strict-Transport-Security` (harmless over plain HTTP; only takes effect once served over HTTPS).

**Nonce-based CSP was evaluated in Phase 10 and deliberately not adopted** — it requires every page to render dynamically (Next only injects a nonce during server-side rendering of a real request, never into a statically-generated page), and this app deliberately statically generates the entire public marketing site for real SEO/performance reasons established since Phase 1. Forcing that to dynamic rendering for a nonce would be a major, regressive architecture change (slower loads, no CDN caching, higher hosting cost) — a bigger trade than a hardening phase should make silently. The experimental hash-based alternative (Subresource Integrity) preserves static generation but doesn't hash inline `style="..."` attributes, which this codebase uses. **Documented remaining tightening, in priority order:** (1) audit and remove inline `style={{...}}` usage, then drop `'unsafe-inline'` from `style-src`; (2) revisit nonce-based `script-src` only if static generation is reconsidered for other reasons. Full reasoning: `src/lib/security/csp.ts`'s header comment.

What Phase 10 did tighten without that trade-off: `img-src` no longer allows the broad `https:` scheme wildcard (this codebase has zero `<img>`/external-image usage anywhere — confirmed by a full source grep — so nothing needs it), and `'unsafe-eval'` is now scoped to non-production only (matches Next's own documented guidance for React's dev-mode error reconstruction).

Next.js itself self-hosts Google Fonts at build time via `next/font/google`, so no `fonts.googleapis.com`/`fonts.gstatic.com` CSP allowance is needed despite using it.

## 5. Rate limiting

`src/lib/security/rate-limit.ts` — a `RateLimiter` interface (`check(key): Promise<boolean>`), with two implementations selected automatically by environment:
- **In-memory** (`InMemoryRateLimiter`) — the default. Correct for a single Node process; resets on restart, doesn't share state across instances.
- **Upstash Redis REST** (`UpstashRateLimiter`, Phase 10 §19) — used automatically when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are both set. Plain `fetch()` against Upstash's REST API (no Redis client dependency added). Fixed-window counter (`INCR` + `EXPIRE ... NX`). **Fails open** on any network/provider error — a rate-limiter outage must never itself become a denial-of-service against real visitors.

Current limiters: form submissions, admin login (per-IP and per-email), AI messages (per-session and per-IP), and analytics ingestion (per-session and per-IP).

**Operational warning, not just documentation:** if the app is running in production without Upstash configured, `rate-limit.ts` logs one `console.warn` at process start so this shows up in platform logs, not only in this doc. Distributed rate limiting is never claimed as active unless the credentials are genuinely present — `isDistributedRateLimitingConfigured()` is the single source of truth for that.

## 6. Database configuration

`src/lib/db/client.ts` — `DATABASE_URL` set → real PostgreSQL via `postgres-js`. Unset in production → the app throws immediately at startup rather than silently falling back to an embedded database — **this is a permanent rule, not something a future phase should relax**: production must never silently fall back from PostgreSQL to PGlite/memory. Unset outside production → PGlite (a real embedded Postgres, WASM, file-persisted under `.data/`).

Connection tuning (Phase 10 §2):
- `DATABASE_POOL_MAX` (default 5) — the `postgres-js` pool size. Serverless deployments (Vercel functions, one process per invocation) should lower this to 1 and rely on a real pooler in front of Postgres (PgBouncer, or the provider's own pooled connection string — e.g. Supabase's "Transaction" mode URL), since many concurrent cold starts each holding a multi-connection pool can exhaust the database's real connection limit fast.
- `idle_timeout: 20s` / `connect_timeout: 10s` are set unconditionally — idle connections release back promptly, and a genuinely unreachable database fails fast instead of hanging a request.
- SSL is read from the connection string itself (`?sslmode=require`); nothing forces it in code, so it must be part of the production `DATABASE_URL`.

## 7. Migrations

Drizzle migrations live in `src/lib/db/migrations/`, generated via `npm run db:generate`. All migrations to date are **additive only** (new tables/columns/indexes; never a destructive `DROP COLUMN`/`DROP TABLE` on data that might be in use) — verified by reading the generated SQL before committing it, every phase.

**Two ways to apply them, for two different situations:**
- `npm run db:migrate` (`drizzle-kit migrate`) — reads `drizzle.config.ts`, which falls back to a placeholder local connection string when `DATABASE_URL` is unset. Fine for local development; **never use this for a production run**, since a misconfigured shell could silently target the placeholder instead of failing.
- `npm run db:migrate:prod` (`scripts/migrate-prod.ts`, Phase 10 §3) — the real production entry point. Refuses to run at all without a genuine `DATABASE_URL` (no placeholder fallback), opens a single dedicated connection, applies only the already-committed migration files, and fails loudly with a clear message on any error. Never resets, drops, or truncates anything.

**Production migration procedure:**
1. Generate the migration locally against the current schema (`npm run db:generate`) and read the generated SQL — confirm it's additive.
2. Run `npm run db:migrate:prod` against the production database (with `DATABASE_URL` set to production) — deliberately a manual, explicit step, never triggered automatically at arbitrary application startup or on every request, since that risks a race between multiple instances starting concurrently.
3. Verify the migration applied cleanly (check the Drizzle migrations table / provider dashboard) before considering the deploy complete.
4. Roll out application code. If something is wrong, roll back the application deploy first (migrations being additive means the old code keeps working against the new schema).

## 8. Backup and recovery

This app does not implement its own backup mechanism — **backups are the responsibility of the production Postgres provider** (e.g. Supabase's automated daily backups and point-in-time recovery, where available on the plan in use). Do not claim backups exist until the actual provider/plan is confirmed to provide them. Recommended owner actions before broad launch:
- Confirm the production database provider's backup frequency and retention window.
- Periodically test an actual restore (not just confirm backups "exist") — a backup that has never been restored is unverified.
- Document the provider-specific retention period once the production database is provisioned (see `docs/LAUNCH_CHECKLIST.md`).

## 9. Environment variables

Centralized inventory: `src/lib/env.ts`. Run `npm run validate:env` for a presence-only report (never prints a value) — categorizes every variable as `required-production`, `optional-integration`, `public`, or `secret`. Required-production variables (`DATABASE_URL`, `ADMIN_SESSION_SECRET`) already fail fast at their actual point of use (`db/client.ts`, `session.ts`); this script is a pre-deploy sanity check, not a replacement for that.

## 9a. Preview vs. production deployment behavior (Phase 10 §8-9)

`src/lib/deployment.ts`'s `isProductionDeployment()`/`getDeploymentEnvironment()` is the one source of truth for "is this actually production" — it trusts Vercel's `VERCEL_ENV` when present (so a preview build, which also runs with `NODE_ENV=production`, is never mistaken for production), falling back to `NODE_ENV` outside Vercel.

- **Canonical URLs** (`buildCanonicalUrl` in `src/lib/seo/site-url.ts`) always point at the real configured `NEXT_PUBLIC_SITE_URL`, regardless of which deployment served the request — this is intentional, standard SEO dedup practice (a preview page's canonical correctly says "the real page lives at the production URL").
- **robots.txt** (`src/app/robots.ts`) disallows everything and omits the sitemap reference entirely on any non-production deployment.
- **Page metadata** (`src/app/[locale]/layout.tsx`) sets a site-wide `robots: {index:false, follow:false}` default on any non-production deployment — a page-level `generateMetadata` that needs to be indexable (e.g. the AI Consultant page) explicitly re-checks `isProductionDeployment()` rather than hardcoding `index:true`, so it can never accidentally override the preview-safe default.
- Admin (`src/app/admin/layout.tsx`) is `noindex` unconditionally, in every environment — unrelated to this mechanism.

Both branches are tested in `tests/integration/seo-sitemap-robots.test.ts`.

## 9b. Email notification architecture (Phase 10 §13-18)

`src/lib/notifications/email-provider.ts` — a small `EmailNotificationProvider` interface, one real implementation (`ResendEmailProvider`, plain REST `fetch()`, no SDK dependency). `getEmailProvider()` returns `null` when `RESEND_API_KEY` is unset — every caller treats that as "skip," never as an error.

`src/lib/notifications/lead-notification-service.ts`:
- **Internal new-lead notification** — sent to `LEAD_NOTIFICATION_EMAIL` (from `LEAD_NOTIFICATION_FROM_EMAIL`) whenever a lead is created or a project request is submitted, if both env vars and the provider are configured. Contains only: reference, name, company, project type/timeline/budget (when a structured brief exists), source, and an Admin CRM link — never the raw message body or AI conversation text.
- **Optional client confirmation email** — off by default even when the provider is fully configured, via `NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL`. English-only for now (a documented limitation: localizing copy for a disabled-by-default feature across 4 locales is deferred until it's actually turned on). Never promises a specific response time.

**Failure isolation is structural, not just a try/catch convention:** `lead-service.ts` calls notifications only *after* a lead is already successfully persisted, and the notification call itself never throws — a Resend outage, a missing `LEAD_NOTIFICATION_EMAIL`, or any other failure is caught, logged, and returns a `SKIPPED`/`FAILED` outcome that the caller cannot mistake for success. A `LeadActivity` (`internal_notification_sent` / `client_confirmation_sent`) is written **only** on a genuine `SENT` outcome — a skipped or failed attempt is never recorded as if something happened.

**Production email domain:** use a real, verified sending domain for `LEAD_NOTIFICATION_FROM_EMAIL` once Resend (or any provider) is configured — never a personal/unverified address as the `From`. Configure the provider's domain verification (SPF/DKIM, and DMARC once the domain is confirmed) before relying on notification delivery in production; an unverified sending domain will have its mail rejected or spam-filtered by most real inboxes regardless of what this app sends.

## 9c. Maintenance mode and feature flags (Phase 10 §30-31)

`src/lib/feature-flags.ts` — a minimal, server-authoritative snapshot (`getFeatureFlags()`), not a feature-flag platform. `isMaintenanceModeEnabled()` (`MAINTENANCE_MODE=true`) is the one flag with real enforcement: it disables new Contact/Project Builder submissions, the AI proposal-capture action, and AI chat (all three server actions plus the `/api/ai/consultant` route check it directly), while the rest of the public site keeps serving normally and **Admin access is never affected** — the flag is never checked anywhere under `src/app/admin`. Admin → Dashboard shows a prominent banner when it's on, specifically so it's never left on by accident.

## 10. Incident basics

- Check `/api/health/ready` first — if it's 503, the database is unreachable; check the provider's status page and connection string before anything else.
- Check Admin → Dashboard's integration health strip for a quick DB/AI/Analytics read.
- Application errors are logged as structured JSON (§2) — search platform logs for `"level":"ERROR"` and the relevant `errorCode`.
- AI provider failures degrade to an honest "temporarily unavailable" state on the AI Consultant page; they never block Contact, Project Builder, or WhatsApp.
- Analytics failures never block lead persistence — `track()`/`trackServer()` swallow their own errors by design (§2 of `docs/ANALYTICS_MEASUREMENT_PLAN.md`).

## 11. Rollback considerations

Because all migrations are additive, rolling back the *application* deploy to a previous version is safe without a corresponding database rollback — the old code simply doesn't reference the newer columns/tables. Rolling back the *database itself* (e.g. restoring a backup) is a separate, much heavier operation and should only be done deliberately, with the provider's restore tooling, never by hand-editing production data.

If a bad deploy needs to come down immediately and there's no time to diagnose: flip `MAINTENANCE_MODE=true` first (stops new writes without taking the whole site offline) while the application rollback proceeds — this is exactly the scenario §9c's maintenance mode exists for.

## 12. Data export, retention, and deletion (Phase 10 §57)

**Internal lead data export** — `GET /admin/leads/[id]/export` (OWNER/ADMIN only) assembles and downloads one lead's full record (lead + project requests + activity timeline + notes) as JSON, audited on every export (`lead_data_exported`). This is distinct from the bulk CRM CSV export at `/admin/leads/export` (any authenticated admin, summary rows only) — the single-lead export carries meaningfully more PII, hence the tighter role gate.

**Deletion/anonymization** is a documented policy gap, not a silent omission: no lead-anonymization or hard-delete capability is implemented yet. Building one safely requires an actual retention policy decision first (what triggers it, what gets removed vs. preserved for legitimate business/legal reasons, how it interacts with `admin_audit_logs` — which must stay complete for security-audit purposes even if the lead it references is later anonymized). Do not hard-delete a lead or its activity/audit trail without that policy in place. Recommended owner action before this is needed in practice: decide the retention policy, then implement anonymization (never audit-log deletion) as a follow-up.

**Retention categories, kept conceptually separate:**
- Lead/CRM data (leads, project requests, activities, notes) — business records, no default expiry, export/anonymization pending policy above.
- Analytics events (`analytics_events`) — anonymous behavioral data; no default auto-deletion is implemented. Don't assume it's retained forever by accident — a retention job is future work once a concrete period is chosen.
- Admin audit logs (`admin_audit_logs`) — a security trail, kept separate from analytics retention policy by design; never conflate the two or delete audit rows to "clean up" unrelated data.
