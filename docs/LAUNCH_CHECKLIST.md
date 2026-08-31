# SIGMA+ Launch Checklist

Status: living document, established in Phase 9. Updated whenever an item's real state changes — **never** marked complete just because code support exists for it. A checkbox here means "verified done," not "buildable."

Legend: ✅ done · ⚠️ code-ready, owner action required · ❌ not started

---

## Infrastructure

- ❌ **Production domain** — `NEXT_PUBLIC_SITE_URL` in `.env.example` points at `https://sigmaplus.agency` as a placeholder; the owner needs to confirm the real production domain and DNS is pointed at the hosting platform.
- ❌ **Production PostgreSQL** — no production database is provisioned yet. `DATABASE_URL` must be set before the app can start in production (`src/lib/db/client.ts` throws immediately otherwise, by design).
- ❌ **Migrations applied to production DB** — depends on the above; follow the procedure in `docs/PRODUCTION_OPERATIONS.md` §7 once a production database exists.
- ❌ **`ADMIN_SESSION_SECRET` configured** — required in production (`src/lib/auth/session.ts` throws otherwise). Generate with `openssl rand -base64 32` and set it in the production environment, not committed anywhere.
- ⚠️ **Backup expectations confirmed** — no backup mechanism exists in this codebase by design; depends entirely on the production Postgres provider's plan. Confirm frequency/retention once that provider is chosen (`docs/PRODUCTION_OPERATIONS.md` §8).

## Admin / security

- ⚠️ **Temporary OWNER password changed** — a one-time OWNER account was provisioned during Phase 5's local verification; the owner must set a real password (via the Account Security section or `npm run admin:create-user`) before any real/production use. Not done automatically, per explicit instruction.
- ✅ Session security (signed JWT, `httpOnly`/`secure`-in-production cookie, 12h expiry, DB-re-verified per request via `requireActor()`).
- ✅ RBAC enforced server-side on every mutation (`assertRole()`), never client-side-only.
- ✅ CSV export formula-injection protection (Phase 5, reconfirmed still in place this phase).
- ✅ Security headers / CSP wired (`docs/PRODUCTION_OPERATIONS.md` §4) — pragmatic policy, documented remaining tightening.
- ⚠️ Rate limiting is in-memory / single-instance only — fine for one Node process, needs a Redis/Upstash-backed adapter before scaling horizontally (not yet built; see `docs/PRODUCTION_OPERATIONS.md` §5).

## Contact / business config

- ⚠️ **Production WhatsApp number confirmed** — two real numbers exist in the source material (`+213 550 47 52 48` Algeria, `+43 660 231 3221` Austria); the owner needs to confirm which is the primary SIGMA+ business line going forward. Currently `NEXT_PUBLIC_WHATSAPP_NUMBER` uses the Austrian number.
- ✅ Contact email/phone wired and displayed (`brahimcontact64@gmail.com`, `+213 550 47 52 48`).

## AI / integrations (all optional by design)

- ⚠️ `ANTHROPIC_API_KEY` — not required for launch; without it, the AI Consultant shows an honest "temporarily unavailable" state and the rest of the site is unaffected. Provide it if SIGMA AI should be live at launch.
- ❌ Google Search Console — not connected (`GOOGLE_SEARCH_CONSOLE_SITE_URL`/`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` unset). Admin → SEO shows NOT_CONFIGURED honestly.
- ❌ GA4 reporting (inbound) — not connected (`GA4_PROPERTY_ID`/`GA4_SERVICE_ACCOUNT_CREDENTIALS_JSON` unset).
- ❌ GA4 outbound (client script) — not configured (`NEXT_PUBLIC_GA4_MEASUREMENT_ID` unset); site fully functions without it.
- ❌ PageSpeed Insights — not connected (`PAGESPEED_API_KEY` unset).

None of the above block launch — they're all documented "not configured" degradations, not broken features.

## SEO

- ✅ Sitemap, robots.txt, canonical/hreflang, JSON-LD structured data, per-page metadata.
- ✅ Deterministic SEO audit passes with 0 errors / 0 warnings as of the last run recorded in this phase's completion report (`npm run seo:audit`).
- ⚠️ Search Console / GA4 verification tokens — optional, add once the owner has access to those consoles for the production domain.

## Privacy / legal

- ⚠️ **Legal review required before broad launch.** The consent banner (`consent-banner.tsx`) is a restrained, honest implementation (Accept / Reject optional / Manage, no dark patterns) but is **explicitly not a certified compliance product** — whether it satisfies GDPR/ePrivacy/CCPA or any other applicable regime depends on the launch market and needs real legal review. See `docs/ANALYTICS_MEASUREMENT_PLAN.md` §8.
- ❌ Privacy policy / cookie policy page — no such page exists in the site yet. Needed before analytics/marketing cookies are used with real visitors in a market that requires one.
- ❌ Terms of service page — same status, not built.

## Analytics / observability

- ✅ First-party analytics event pipeline, PII sanitization, closed event schema (`docs/ANALYTICS_MEASUREMENT_PLAN.md`).
- ✅ `/api/health` and `/api/health/ready` live.
- ✅ Structured logging + error taxonomy in place.
- ⚠️ Web Vitals collection is architecture-ready; treat any dashboard numbers as provisional until real production traffic accumulates.

## Final pre-launch validation

- ✅ `npx tsc --noEmit` clean.
- ✅ `npx eslint .` clean.
- ✅ `npx vitest run` — see this phase's completion report for the current pass count.
- ✅ `npm run seo:audit` — 0 errors / 0 warnings as of this phase.
- ✅ `npx next build` succeeds.
- ❌ Manual smoke check on the actual production deployment (once domain/DB/secrets are live) — short, non-blocking pass through Home → a Service → Contact submit → Project Builder submit → AI Consultant (if key configured) → Admin login → Analytics dashboard → logout. Per the durable project policy, this is a manual pass, never automated browser E2E (Playwright/Cypress/Selenium are permanently disabled for this project).
