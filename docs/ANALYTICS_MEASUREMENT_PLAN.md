# SIGMA+ Analytics Measurement Plan

Status: living document, established in Phase 9. Updated whenever the analytics/conversion-intelligence architecture changes materially.

This document defines every KPI shown in Admin → Analytics, exactly what it measures, and — just as important — what it does **not** measure yet. Where this document and code disagree, the code (`src/lib/services/growth-analytics-service.ts`, `src/lib/repositories/analytics-repository.ts`) is the current truth.

Permanent rule, restated: **nothing in this system is ever fabricated.** Zero data renders as an honest empty state or a `null`/"—" rate, never an invented number.

---

## 1. Architecture overview

```
event fired (client or server)
  → track() / trackServer()                (src/lib/integrations/analytics.ts, analytics-server.ts)
  → validateAnalyticsPayload()              (src/lib/analytics/sanitize.ts — PII guard + closed schema)
  → AnalyticsService.recordEvent()          (src/lib/services/analytics-service.ts)
  → analytics_events table                  (src/lib/db/schema.ts)
  → AnalyticsRepository query layer         (src/lib/repositories/analytics-repository.ts)
  → GrowthAnalyticsService                  (src/lib/services/growth-analytics-service.ts)
  → Admin → Analytics dashboard             (src/app/admin/(protected)/analytics/page.tsx)
```

This is a **first-party, own-database** system — not a wrapper around GA4. The optional GA4 *outbound* adapter (`src/components/analytics/ga4-outbound.tsx`, §8 below) is a separate, independent stream with no bearing on any number in this document. Phase 8's GA4 *reporting* adapter (`src/lib/seo/adapters/analytics-reporting.ts`) is also unrelated — it reads GA4 data back for the SEO dashboard, not this one.

## 2. Event taxonomy

The full, closed list lives in `src/domain/analytics-event.ts` (`ANALYTICS_EVENTS`). Every event name below is either genuinely instrumented today or explicitly marked "architecture only, not yet fired anywhere."

| Event | Fired from | Status |
|---|---|---|
| `page_view` | `page-view-tracker.tsx`, every route under `[locale]` | Live |
| `cta_click` | `tracked-cta-link.tsx` — Start Project CTA on service/case-study/article detail pages | Live (only that one CTA today) |
| `service_viewed` | `services/[slug]/page.tsx` | Live |
| `case_study_viewed` | `work/[slug]/page.tsx` | Live |
| `article_viewed` | `insights/[slug]/page.tsx` | Live |
| `project_builder_viewed` / `_started` / `_step_completed` / `_abandoned` / `_completed` | `project-builder.tsx` | Live |
| `ai_consultant_viewed` / `ai_consultation_started` / `ai_message_sent` / `ai_qualification_updated` / `ai_builder_handoff` / `ai_contact_requested` / `ai_error` | `ai-consultant-panel.tsx` (client) + `/api/ai/consultant/route.ts` (server) | Live |
| `contact_form_started` / `_submitted` / `_failed` | `contact-form.tsx` | Live |
| `lead_created` | `project-builder.tsx`, `ai-consultant-panel.tsx` (tagged `source`) | Live |
| `whatsapp_handoff_clicked` | `contact-form.tsx`, `result-screen.tsx` | Live |
| `proposal_requested` | — | **Architecture only** — schema/taxonomy support this event; no call site fires it yet. Reserved for a future explicit "request a proposal" CTA distinct from the AI Consultant's own capture flow. |
| `web_vital` | `web-vitals-reporter.tsx` | Live |

Adding a new event means adding one entry to `ANALYTICS_EVENTS` and one row to `analyticsPropsSchema` if it needs new dimensions — never a second, differently-named event for the same real-world thing.

## 3. Dimensions and PII

Every event's `properties` are validated against `analyticsPropsSchema` (`src/domain/analytics-event.ts`) — a **closed** Zod schema (`.strict()`). An unrecognized key rejects the whole payload; there is no arbitrary-property-bag path into `analytics_events`.

On top of the schema, `src/lib/analytics/sanitize.ts` inspects every *value* (regardless of which key it's in) for an email- or phone-number shape and strips just that field if it matches — defense in depth against a future bug that accidentally passes real contact data into e.g. `source` or `context`. Proven by `tests/integration/analytics-sanitize.test.ts`.

Never present in this system, by construction: name, email, phone, message body, AI conversation text, notes, or raw query strings.

## 4. Anonymous session ID

`src/lib/analytics/session-id.ts` — a random `crypto.randomUUID()`, stored in `localStorage`, rotated after 30 days. Not derived from IP, email, phone, or any device fingerprint. Exists purely for **funnel continuity within one browser** — never for cross-device tracking, and never exposed publicly (it's an internal correlation key inside `analytics_events`, not a public identifier).

The AI Consultant funnel deliberately reuses the AI's own session id (`src/lib/ai/session-id.ts`, also a random localStorage UUID) as the analytics session id for AI-related events, so client-fired and server-fired events for the same visitor land in the same session without a second id.

## 5. Lead attribution bridge

When a Contact or Project Builder submission creates (or matches) a lead, `lead-service.ts` calls `AnalyticsService.attachSessionToLead(anonymousSessionId, leadId)` if the client supplied its session id with the submission. This retroactively links every **prior, previously-unattributed** event from that session to the lead — it never rewrites an event already attached to a different lead (`attachSessionToLead`'s `WHERE lead_id IS NULL` guard; proven by `tests/integration/analytics-repository.test.ts`). This is what makes "attributed leads" in the Services/Case Studies/Articles breakdown real rather than guessed.

## 6. Attribution model: First Touch

`lead-service.ts`'s `findOrCreateLead()` captures `landingPage`/`referrer`/`utm_*` **exactly once**, at the moment a lead is first created. A returning visitor who resubmits via a different channel never overwrites it (the dedup path returns the existing lead unchanged). This *is* the entire First Touch model — there is no multi-touch weighting, no last-touch override, and no plan to add one without a documented reason. UTM values are length-capped and stripped of obviously script-shaped payloads at capture time (`src/lib/attribution/sanitize-utm.ts`).

`src/lib/attribution/channel.ts`'s `classifyChannel()` buckets that First Touch into one of: `direct`, `organic_search`, `paid_search`, `social`, `email`, `referral`, `other` — a simple, documented heuristic (UTM medium/source, or referrer host as a fallback), not a certified marketing-attribution product.

**Known limitation:** the Admin "Acquisition" section reports **lead-level** channels only, not a session-level breakdown — `page_view` doesn't currently carry UTM/source dimensions, so there is no real session-level channel data to report. Adding one would mean guessing; it isn't done.

## 7. KPI definitions

All ranges use UTC day boundaries (`src/lib/analytics/rates.ts`'s `lastNDaysRange`), and every rate uses `safeRate()`/`percentChange()`, which return `null` (rendered as "—") instead of `Infinity`/`NaN`/0% for a zero denominator.

| KPI | Numerator | Denominator | Source |
|---|---|---|---|
| Sessions | Distinct `anonymousSessionId` across all events, `environment = production` | — | `analytics_events` |
| Leads created | Leads with `createdAt` in range | — | `leads` |
| Conversion rate | Leads created | Sessions | derived |
| WhatsApp handoffs | Distinct sessions firing `whatsapp_handoff_clicked` | — | `analytics_events` |
| AI-assisted sessions | Distinct sessions firing `ai_consultation_started` | — | `analytics_events` |
| Project Builder funnel stage-N conversion | Distinct sessions at stage N | Distinct sessions at stage N-1 | `analytics_events` |
| Project Builder abandonment | Distinct sessions firing `project_builder_abandoned` | Distinct sessions firing `project_builder_started` | `analytics_events` |
| AI Consultant funnel stage-N conversion | Same pattern as Project Builder | | `analytics_events` |
| AI-assisted vs. other conversion | Sessions with (`ai_consultation_started` AND `lead_created`) / Sessions with `ai_consultation_started` — and the complement for "other" | | `analytics_events` — **correlation only, see §9** |
| Service/case-study/article views, CTA clicks, attributed leads | Per-id distinct-session counts, grouped from `safeProperties` | | `analytics_events`, session-attributed |
| Lead → Qualified, Qualified → Won | Status-count ratios in range | | `leads` |

**Abandonment, precisely defined:** a session counts as abandoned only when it fired `project_builder_started` without `project_builder_completed`, **and** the browser tab was actually closed or navigated away mid-flow — captured via a `beforeunload` listener in `project-builder.tsx` that fires `project_builder_abandoned` at that exact moment. A visitor who simply hasn't finished yet (tab still open) is not counted as abandoned. This is a deterministic behavioral rule, not a "hasn't finished within N seconds" timeout guess.

## 8. Consent and the GA4 outbound adapter

Consent categories: `ESSENTIAL` (never gated — the site's core functions always work), `ANALYTICS` (gates the first-party `track()` client POST and Web Vitals reporting), `MARKETING` (reserved; not currently used by any adapter — GA4 outbound is gated on the `ANALYTICS` category today, since it is itself a form of analytics). See `src/lib/consent/consent-store.ts` and `consent-banner.tsx`.

**This consent implementation is not a certified legal-compliance product.** Whether it satisfies GDPR/ePrivacy/CCPA or any other regime depends on the launch market and requires real legal review before broad launch — see `docs/LAUNCH_CHECKLIST.md`.

The optional GA4 outbound script (`src/components/analytics/ga4-outbound.tsx`) loads only when `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is configured **and** the visitor has accepted analytics consent at the time the page loaded. Consent given mid-session takes effect on the next navigation, not instantly — a documented simplification, not a bug.

## 9. Correlation, never causation

The "AI-assisted vs. other sessions" comparison is exactly what it says: an observed association between using SIGMA AI in a session and that session later producing a lead. It is **not** a controlled experiment — there is no randomized assignment of visitors to "AI" vs. "no AI," and no control for the obvious confound that a visitor who chooses to engage with AI may already be a more qualified/motivated lead. Report this as "conversion among AI-assisted sessions was X%" — never as "AI increased conversions by X%" or any other causal phrasing, in the dashboard, in any internal report, or externally.

## 10. Deal value and lost reasons

Deal value (`leads.dealValueMinorUnits` / `dealCurrency`) is **manual-only** — entered by an admin on the lead detail page (`components/admin/deal-form.tsx`), through `src/lib/money.ts`'s integer-minor-units handling. It is never auto-inferred from a Project Builder budget *range* (which is a bucket like "$5k–$15k", not a real figure), and no revenue/forecast total is computed anywhere unless every contributing lead has a real, manually-entered value.

Lost reasons are one of a fixed, structured set (`BUDGET`, `TIMING`, `NO_RESPONSE`, `COMPETITOR`, `SCOPE_MISMATCH`, `INTERNAL_DECISION`, `OTHER` — `src/domain/lead.ts`'s `LOST_REASONS`) plus an optional free-text note. Never required retroactively on leads that were already lost before this field existed.

## 11. Data freshness

The dashboard shows the real timestamp of the most recent recorded event (`GrowthAnalyticsService.getDataFreshness()`) rather than implying real-time data. There is no streaming/real-time pipeline — every number is computed on page load from the current database state.

## 12. Known limitations (honest, not exhaustive)

- Session-level acquisition channel breakdown doesn't exist yet (§6).
- `cta_click` is only wired to one CTA (Start Project on content detail pages) — not every button on the site.
- `builderStarts` in the per-content breakdown is not computed (would require a second-event-in-same-session join per content id) — deliberately left unset rather than guessed.
- Web Vitals is real-user-monitoring architecture; until enough production traffic accumulates, don't cite it as an established field-CWV baseline.
- No bot/crawler filtering beyond requiring JavaScript execution (client-side `track()` calls) and an `environment` tag that lets non-production traffic be excluded from dashboards.
