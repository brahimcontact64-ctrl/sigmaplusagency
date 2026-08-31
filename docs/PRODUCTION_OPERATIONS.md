# SIGMA+ Production Operations

Status: living document, established in Phase 9. Updated whenever the observability/deployment architecture changes materially.

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

**Documented remaining tightening:** move `script-src`/`style-src` to nonce- or hash-based once a per-request nonce is threaded through the app — shipping a stricter CSP without that plumbing would silently break the app rather than making it safer.

Next.js itself self-hosts Google Fonts at build time via `next/font/google`, so no `fonts.googleapis.com`/`fonts.gstatic.com` CSP allowance is needed despite using it.

## 5. Rate limiting

`src/lib/security/rate-limit.ts` — a single `RateLimiter` interface (`check(key): boolean`), currently backed by an in-memory implementation. This is correct for a single Node process; it resets on restart and doesn't share state across instances. Current limiters: form submissions, admin login (per-IP and per-email), AI messages (per-session and per-IP), and analytics ingestion (per-session and per-IP).

**Scaling beyond one instance requires a shared store** (Redis/Upstash). No such adapter is wired up yet — this is a documented gap, not a silent one: do not claim distributed rate limiting is in place until a real shared-store adapter exists behind the same interface. When adding one, gate it on the relevant credentials being configured, falling back to the current in-memory behavior otherwise (the same "optional integration, honest degradation" pattern used everywhere else in this codebase).

## 6. Database configuration

`src/lib/db/client.ts` — `DATABASE_URL` set → real PostgreSQL via `postgres-js` (`max: 5` connections). Unset in production → the app throws immediately at startup rather than silently falling back to an embedded database. Unset outside production → PGlite (a real embedded Postgres, WASM, file-persisted under `.data/`).

**Recommended production deployment config:**
- Use a managed Postgres provider (Supabase or equivalent) with connection pooling (PgBouncer or provider-native pooling) if deploying to a serverless/edge platform where connection counts can spike — `postgres-js`'s `max: 5` is a per-instance cap, and a serverless platform can spin up many instances concurrently.
- Ensure `sslmode=require` (or the provider's equivalent) is part of the connection string in production.
- Set a reasonable statement/idle timeout at the provider level if the provider supports it; this app does not currently configure one explicitly in `postgres-js`'s options beyond the connection cap.

## 7. Migrations

Drizzle migrations live in `src/lib/db/migrations/`, generated via `npm run db:generate` and applied via `npm run db:migrate`. All migrations to date are **additive only** (new tables/columns/indexes; never a destructive `DROP COLUMN`/`DROP TABLE` on data that might be in use) — verified by reading the generated SQL before committing it, every phase.

**Production migration procedure:**
1. Generate the migration locally against the current schema (`npm run db:generate`) and read the generated SQL — confirm it's additive.
2. Deploy the application code (which may reference new columns/tables) alongside or after running `npm run db:migrate` against the production database — never run migrations automatically at arbitrary application startup, since that risks a race between multiple instances starting concurrently.
3. Verify the migration applied cleanly (check the Drizzle migrations table / provider dashboard) before considering the deploy complete.
4. Roll out application code. If something is wrong, roll back the application deploy first (migrations being additive means the old code keeps working against the new schema).

## 8. Backup and recovery

This app does not implement its own backup mechanism — **backups are the responsibility of the production Postgres provider** (e.g. Supabase's automated daily backups and point-in-time recovery, where available on the plan in use). Do not claim backups exist until the actual provider/plan is confirmed to provide them. Recommended owner actions before broad launch:
- Confirm the production database provider's backup frequency and retention window.
- Periodically test an actual restore (not just confirm backups "exist") — a backup that has never been restored is unverified.
- Document the provider-specific retention period once the production database is provisioned (see `docs/LAUNCH_CHECKLIST.md`).

## 9. Environment variables

Centralized inventory: `src/lib/env.ts`. Run `npm run validate:env` for a presence-only report (never prints a value) — categorizes every variable as `required-production`, `optional-integration`, `public`, or `secret`. Required-production variables (`DATABASE_URL`, `ADMIN_SESSION_SECRET`) already fail fast at their actual point of use (`db/client.ts`, `session.ts`); this script is a pre-deploy sanity check, not a replacement for that.

## 10. Incident basics

- Check `/api/health/ready` first — if it's 503, the database is unreachable; check the provider's status page and connection string before anything else.
- Check Admin → Dashboard's integration health strip for a quick DB/AI/Analytics read.
- Application errors are logged as structured JSON (§2) — search platform logs for `"level":"ERROR"` and the relevant `errorCode`.
- AI provider failures degrade to an honest "temporarily unavailable" state on the AI Consultant page; they never block Contact, Project Builder, or WhatsApp.
- Analytics failures never block lead persistence — `track()`/`trackServer()` swallow their own errors by design (§2 of `docs/ANALYTICS_MEASUREMENT_PLAN.md`).

## 11. Rollback considerations

Because all migrations are additive, rolling back the *application* deploy to a previous version is safe without a corresponding database rollback — the old code simply doesn't reference the newer columns/tables. Rolling back the *database itself* (e.g. restoring a backup) is a separate, much heavier operation and should only be done deliberately, with the provider's restore tooling, never by hand-editing production data.
