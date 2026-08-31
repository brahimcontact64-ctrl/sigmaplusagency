# SIGMA+ Launch Checklist

Status: living document, established in Phase 9, extended in Phase 10. Updated whenever an item's real state changes — **never** marked complete just because code support exists for it. A checkbox here means "verified done," not "buildable."

Legend: ✅ done · ⚠️ code-ready, owner action required · ❌ not started

---

## Infrastructure

- ❌ **Production domain** — `NEXT_PUBLIC_SITE_URL` in `.env.example` points at `https://sigmaplus.agency` as a placeholder; the owner needs to confirm the real production domain and DNS is pointed at the hosting platform (A/CNAME per the platform, `www` vs. apex decision, HTTPS issuance).
- ❌ **Production PostgreSQL** — no production database is provisioned yet. `DATABASE_URL` must be set before the app can start in production (`src/lib/db/client.ts` throws immediately otherwise, by design — production must never silently fall back to PGlite/memory).
- ❌ **Migrations applied to production DB** — depends on the above; run `npm run db:migrate:prod` (Phase 10 §3) once a production database exists — see `docs/DEPLOYMENT_RUNBOOK.md`.
- ❌ **`ADMIN_SESSION_SECRET` configured** — required in production (`src/lib/auth/session.ts` throws otherwise). Generate with `openssl rand -base64 32` and set it in the production environment, not committed anywhere.
- ⚠️ **Backup expectations confirmed** — no backup mechanism exists in this codebase by design; depends entirely on the production Postgres provider's plan. Confirm frequency/retention once that provider is chosen (`docs/PRODUCTION_OPERATIONS.md` §8).
- ⚠️ **`DATABASE_POOL_MAX` tuned for the deployment target** — defaults to 5 (fine for a long-lived server); set to 1 with a real pooler in front of Postgres if deploying to a serverless platform (`docs/PRODUCTION_OPERATIONS.md` §6).

## Admin / security

- ⚠️ **Temporary OWNER password changed** — a one-time OWNER account was provisioned during Phase 5's local verification; the owner must set a real password (via the Account Security section or `npm run admin:create-user`) before any real/production use. **This is a hard launch gate, not a nice-to-have** — do not consider the app launch-ready with that credential still active.
- ✅ Session security (signed JWT, `httpOnly`/`secure`-in-production cookie, `sameSite=lax`, 12h expiry, DB-re-verified per request via `requireActor()`, logout invalidates the session and is audited). No session token is ever stored in `localStorage`.
- ✅ RBAC enforced server-side on every mutation and every sensitive read (`assertRole()`/role checks re-verified this phase across Leads, CSV export, single-lead JSON export, content preview, settings, SEO actions, Analytics), never client-side-only.
- ✅ CSV export formula-injection protection (Phase 5, reconfirmed still in place this phase).
- ✅ Security headers / CSP wired (`docs/PRODUCTION_OPERATIONS.md` §4) — pragmatic policy (nonce-based CSP deliberately evaluated and rejected this phase, see that doc), `img-src` tightened, dev-only `unsafe-eval`.
- ✅ Branded error boundaries (`[locale]/error.tsx`, `global-error.tsx`, `admin/error.tsx`) — no raw stack traces ever shown to a visitor.
- ⚠️ **Distributed rate limiting** — the adapter now exists (`UpstashRateLimiter`, Phase 10 §19) but is inactive without `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Without them, rate limits are per-instance (in-memory) — fine for a single-instance deploy, a real gap for a multi-instance one. The app logs an explicit warning in production when this is the case.
- ✅ No E2E automation framework present anywhere in the repo (no Playwright/Cypress/Selenium config, no `test:e2e` script) — verified as a launch gate this phase, not just assumed.

## Contact / business config

- ⚠️ **Production WhatsApp number confirmed** — two real numbers exist in the source material (`+213 550 47 52 48` Algeria, `+43 660 231 3221` Austria); the owner needs to confirm which is the primary SIGMA+ business line going forward. Currently `NEXT_PUBLIC_WHATSAPP_NUMBER` uses the Austrian number.
- ✅ Contact email/phone wired and displayed (`brahimcontact64@gmail.com`, `+213 550 47 52 48`), read from one canonical effective site config on every surface (header, footer, homepage CTA, Contact, Project Builder success, AI handoff).

## Email notifications (Phase 10 §13-18, new this phase)

- ⚠️ `RESEND_API_KEY` — not configured. Without it, lead persistence works exactly the same and notifications are silently skipped (never a failure). Provide it, plus `LEAD_NOTIFICATION_EMAIL` and a **verified sending domain** as `LEAD_NOTIFICATION_FROM_EMAIL`, to enable internal new-lead emails.
- ❌ Sender domain SPF/DKIM/DMARC — not configured (no domain provisioned for sending yet). Required before real notification delivery is reliable; see `docs/PRODUCTION_OPERATIONS.md` §9b.
- ✅ Client confirmation emails are off by default (`NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL`) even if the provider is configured — an explicit, separate opt-in.

## AI / integrations (all optional by design)

- ⚠️ `ANTHROPIC_API_KEY` — not required for launch; without it, the AI Consultant shows an honest "temporarily unavailable" state and the rest of the site is unaffected. Provide it if SIGMA AI should be live at launch.
- ❌ Google Search Console — not connected (`GOOGLE_SEARCH_CONSOLE_SITE_URL`/`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` unset). Admin → SEO shows NOT_CONFIGURED honestly.
- ❌ GA4 reporting (inbound) — not connected (`GA4_PROPERTY_ID`/`GA4_SERVICE_ACCOUNT_CREDENTIALS_JSON` unset).
- ❌ GA4 outbound (client script) — not configured (`NEXT_PUBLIC_GA4_MEASUREMENT_ID` unset); site fully functions without it.
- ❌ PageSpeed Insights — not connected (`PAGESPEED_API_KEY` unset).

None of the above block launch — they're all documented "not configured" degradations, not broken features. Connecting them is safe to do shortly *after* go-live (see `docs/DEPLOYMENT_RUNBOOK.md` step 15).

## SEO

- ✅ Sitemap, robots.txt, canonical/hreflang, JSON-LD structured data, per-page metadata.
- ✅ Deterministic SEO audit passes with 0 errors / 0 warnings as of the last run recorded in this phase's completion report (`npm run seo:audit`).
- ✅ Preview/development deployments are `noindex` and excluded from crawling (`docs/PRODUCTION_OPERATIONS.md` §9a) — verified this phase, was a real gap before.
- ⚠️ Search Console / GA4 verification tokens — optional, add once the owner has access to those consoles for the production domain.

## Privacy / legal

- ⚠️ **Legal review required before broad launch.** The consent banner (`consent-banner.tsx`), Privacy Policy, and Terms of Service pages are restrained, honest, general-information drafts — each carries an explicit on-page notice that they are **not certified compliance products** and have not been reviewed by a lawyer. Whether they satisfy GDPR/ePrivacy/CCPA or any other applicable regime depends on the launch market and needs real legal review before broad public launch.
- ✅ Privacy Policy page live at `/privacy-policy` (all 4 locales), linked from the footer — covers what's collected, cookies, third parties, retention, and rights, in plain draft language.
- ✅ Terms of Service page live at `/terms` (all 4 locales), linked from the footer.
- ❌ Final, lawyer-reviewed legal copy — not done; the current pages are the honest placeholder described above.
- ❌ Governing law / jurisdiction — left as an explicit placeholder in the Terms page pending the owner's decision.

## Analytics / observability

- ✅ First-party analytics event pipeline, PII sanitization, closed event schema (`docs/ANALYTICS_MEASUREMENT_PLAN.md`).
- ✅ `/api/health` and `/api/health/ready` live, minimal output only.
- ✅ Structured logging + error taxonomy in place; log redaction verified against real secret-shaped keys (password/email/phone/JWT/API key/authorization/cookie).
- ✅ Repository-level secret scan performed this phase — no real credentials found in tracked files (only placeholder values in `.env.example`/`drizzle.config.ts`).
- ⚠️ Web Vitals collection is architecture-ready; treat any dashboard numbers as provisional until real production traffic accumulates.

## Production readiness scorecard

Never turn an unknown into READY. `PARTIAL` means real, working code exists but an owner action or external dependency is still needed before it's fully live.

| Area | Status | Notes |
|---|---|---|
| CODE READY | READY | tsc/eslint/vitest/build all pass; no E2E framework present; core features (site, CRM, AI, analytics, notifications, maintenance mode) implemented and tested. |
| INFRA READY | BLOCKED | No production domain or production PostgreSQL provisioned yet; `ADMIN_SESSION_SECRET` not yet set for production. |
| SECURITY READY | PARTIAL | Auth/RBAC/CSP/headers/error boundaries all in place; distributed rate limiting inactive without Upstash credentials; temp OWNER password not yet rotated. |
| CONTENT READY | PARTIAL | Core commercial content complete; 4 case studies still lack narrative sections (tracked, not fabricated); zero seed Insights articles (an accepted, honest state). |
| LEGAL READY | BLOCKED | Draft Privacy/Terms pages exist and are honestly labeled as such; no lawyer review has occurred. |
| ANALYTICS READY | PARTIAL | First-party pipeline fully live; GSC/GA4/PageSpeed all NOT_CONFIGURED (optional, non-blocking); Web Vitals has no real traffic yet. |
| OPERATIONS READY | PARTIAL | Runbook, rollback guidance, health checks, and logging all in place; backups depend on a not-yet-chosen production DB provider; email notifications depend on a not-yet-configured provider/domain. |

## Manual smoke checklist (Phase 10 §64)

Run this by hand against the target deployment after each significant release, and always once against production right after go-live. Manual only — never automated browser E2E, per the durable project policy.

- [ ] Home loads correctly in FR (default locale)
- [ ] Switch to AR — layout mirrors to RTL correctly, nothing visually broken
- [ ] Switch to EN
- [ ] Switch to DE
- [ ] Open a Service detail page, click "Start a Project"
- [ ] Complete the Project Builder end-to-end, reach the success screen with a real `SP-XXXXXX` reference
- [ ] Submit the Contact form, reach its success screen
- [ ] Open AI Consultant (if `ANTHROPIC_API_KEY` is configured), send a message, get a real streamed reply
- [ ] Click a WhatsApp link, confirm it opens with a correctly pre-filled message
- [ ] Log into Admin, confirm the lead(s) just submitted appear in Leads
- [ ] Change a lead's status, confirm it's reflected immediately and appears in the activity timeline
- [ ] Add an internal note to a lead
- [ ] Open Admin → Content, preview a piece of content (if any exists)
- [ ] Open Admin → SEO, confirm the audit/dashboard renders
- [ ] Open Admin → Analytics, confirm the dashboard renders (data may be empty on a fresh deployment — that's correct, not a bug)
- [ ] Log out of Admin, confirm the session is actually invalidated (back button doesn't restore access)

## Final pre-launch validation

- ✅ `npx tsc --noEmit` clean.
- ✅ `npx eslint .` clean.
- ✅ `npx vitest run` — see this phase's completion report for the current pass count.
- ✅ `npm run seo:audit` — 0 errors / 0 warnings as of this phase.
- ✅ `npx next build` succeeds.
- ✅ `npx drizzle-kit generate` reports no schema drift.
- ❌ Manual smoke check on the actual production deployment — see the checklist above; must be run for real once domain/DB/secrets are live, not just conceptually reviewed.
