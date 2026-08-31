# SIGMA+ Deployment Runbook

Status: living document, established in Phase 10. This is the exact, ordered sequence for taking SIGMA+ from code to a live production deployment. Pairs with `docs/PRODUCTION_OPERATIONS.md` (architecture/config reference) and `docs/LAUNCH_CHECKLIST.md` (readiness scorecard + owner actions). No step here is automated browser E2E — every verification step is either a script, an HTTP check, or a short manual pass, per the project's durable no-E2E policy.

---

## 1. Provision the database

Create a production PostgreSQL database (Supabase or any standard Postgres host). Note the connection string. If deploying to a serverless platform (Vercel functions), prefer the provider's pooled/"transaction mode" connection string over a direct connection, and plan to set `DATABASE_POOL_MAX=1` (see `docs/PRODUCTION_OPERATIONS.md` §6).

## 2. Configure environment variables

Set, at minimum, the required-production variables (`DATABASE_URL`, `ADMIN_SESSION_SECRET`) on the hosting platform. Set `NEXT_PUBLIC_SITE_URL` to the real production domain. Configure any optional integrations you want live at launch (see `src/lib/env.ts` for the full inventory). Run `npm run validate:env` to sanity-check presence (never prints values).

## 3. Run migrations

```
DATABASE_URL=<production-url> npm run db:migrate:prod
```

Confirm it reports success. This only ever applies additive, already-committed migration files — see `docs/PRODUCTION_OPERATIONS.md` §7 for the full procedure and rollback notes.

## 4. Create the OWNER admin account

```
DATABASE_URL=<production-url> npm run admin:create-user -- --email=<owner-email> --password=<strong-password> --name="<name>" --role=OWNER
```

Run this against the production database directly (not through a deployed environment's shell unless that's how you access it) so credentials never pass through application logs. Do not print or commit the password anywhere.

## 5. Deploy a preview

Deploy the application to a preview environment first (e.g. a Vercel preview deployment). Confirm the build succeeds.

## 6. Verify preview is noindex

Check the preview URL's `/robots.txt` — it must disallow everything. Check a page's rendered `<meta name="robots">` — it must be `noindex, nofollow`. Both are automatic (`src/lib/deployment.ts`'s environment detection), but verify once per deployment platform change. See `docs/PRODUCTION_OPERATIONS.md` §9a.

## 7. Configure the production domain

Point DNS at the hosting platform (A/CNAME per the platform's instructions), confirm HTTPS is issued and working, and decide/apply the `www` vs. apex redirect policy. If email notifications are enabled, configure the sending domain's SPF/DKIM (and DMARC once the domain is confirmed) — see `docs/PRODUCTION_OPERATIONS.md` §9b.

## 8. Deploy to production

Promote the verified build (or trigger a fresh production deploy) once the domain and environment are confirmed.

## 9. Smoke check

Run through `docs/LAUNCH_CHECKLIST.md`'s manual smoke checklist against the live production URL.

## 10. Verify sitemap and robots on the real domain

`/sitemap.xml` should list real production URLs (not preview/localhost ones) and `/robots.txt` should allow crawling with `/admin`/`/api/` disallowed.

## 11. Verify a real lead submission

Submit the Contact form (or Project Builder) once for real, with a disposable/test-safe identity. Confirm:
- A public `SP-XXXXXX` reference is returned.
- The lead appears in Admin → Leads.
- If email notifications are configured, the internal notification arrives.

## 12. Verify CRM

Log into Admin with the OWNER account created in step 4. Confirm the dashboard loads, the test lead from step 11 is visible, and a status change / note / deal value update works and appears in the activity timeline.

## 13. Verify email/WhatsApp if configured

If `RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL` are set, confirm the internal notification email actually arrived (check spam too, especially before DKIM/SPF/DMARC are fully warmed up). Confirm the WhatsApp handoff link on the lead's success screen opens a correctly pre-filled chat.

## 14. Verify AI if enabled

If `ANTHROPIC_API_KEY` is set, open the AI Consultant page, send a message, confirm a real streamed response, and confirm the "Continue with Project Builder" / "Request a proposal" handoffs work.

## 15. Connect analytics/search tools (can happen shortly after launch, not a blocker)

Google Search Console, GA4 (reporting and/or outbound), and PageSpeed Insights can all be connected after go-live — Admin → SEO shows an honest `NOT_CONFIGURED` state until then, and nothing about launch depends on these.

## 16. Confirm backups

Confirm the production database provider's backup schedule is active (check the provider dashboard — this app has no backup mechanism of its own, see `docs/PRODUCTION_OPERATIONS.md` §8). Note the retention window in `docs/LAUNCH_CHECKLIST.md`.

---

## Rollback

See `docs/PRODUCTION_OPERATIONS.md` §11. In short: because migrations are additive-only, rolling back the application deploy is always safe on its own; database rollback (restoring a backup) is a separate, heavier decision that should never be taken automatically. If something is actively broken and needs to stop immediately, set `MAINTENANCE_MODE=true` first while you decide on the application rollback.
