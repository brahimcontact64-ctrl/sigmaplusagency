# SIGMA+ SEO Strategy — Technical Foundation

Status: living document, established in Phase 7. Updated whenever the SEO architecture changes materially.

This document is the policy layer behind `src/lib/seo/*`. Where this document and code disagree, the code is the current truth and this document is stale — fix the document.

---

## 1. Guiding rules (permanent, not just for Phase 7)

- Never fabricate rankings, traffic, backlinks, reviews, locations, or business claims.
- Never promise a #1 Google ranking, or any ranking outcome.
- Every structured-data field must correspond to something real and visible on the page (or the underlying business fact) — never invented to look more complete.
- Every SEO recommendation must be ethical and sustainable (no cloaking, no doorway pages, no link schemes, no city-spam).
- No automated browser E2E testing — this is a durable, project-wide rule independent of SEO; see `docs/SIGMA_PLUS_MASTER_PLAN.md`'s "PROJECT POLICY" section.

## 2. SEO architecture audit (state before Phase 7)

What already existed and worked, so Phase 7 didn't rebuild it:
- Localized routing and slugs (`next-intl`, `src/i18n/routing.ts`), full RTL for Arabic.
- Per-page `generateMetadata` with a real canonical + alternates on every content page.
- Basic JSON-LD on the homepage (Organization-shaped), service pages (Service), and case-study pages (CreativeWork).
- A visual + JSON-LD breadcrumb component with the two already guaranteed to match (`src/components/ui/breadcrumbs.tsx`).
- `next-intl`'s `alternateLinks` auto-header already correctly disabled (Phase 3 finding — it would emit wrong hreflang for localized slugs).
- A `matchesSlug()` workaround for a Next.js 16.3.3/Turbopack non-ASCII-slug prerender bug (Phase 3 finding, still required — see the project memory file, not repeated here).

Real gaps found and fixed this phase:
- Canonical/hreflang construction was duplicated ad hoc in 9+ files, with no `x-default` anywhere.
- `sitemap.ts` was missing `/ai-consultant` (shipped in Phase 6, never added) and fabricated `lastModified: new Date()` on every entry.
- `robots.ts` allowed everything with no explicit `/admin`/`/api/` disallow (defense-in-depth only — auth was and is the real boundary).
- JSON-LD was built ad hoc per page (repeated `{"@context":...}` objects) instead of one centralized, `@id`-linked builder — Organization was duplicated as a nested object on every Service/CreativeWork node instead of referenced.
- No FAQPage schema existed despite service pages visibly rendering an FAQ.
- No deterministic SEO audit tooling existed at all.
- `site_settings`'s company identity (Phase 5/6) fed the public site's contact info but not yet any SEO surface — now the Organization schema uses it too (see §9).

## 3. Indexability matrix

| Route | Index? | Why |
|---|---|---|
| `/{locale}` (home) | INDEX, FOLLOW | Primary commercial page |
| `/{locale}/services`, `/services/{slug}` | INDEX, FOLLOW | Commercial content |
| `/{locale}/work`, `/work/{slug}` | INDEX, FOLLOW | Commercial content |
| `/{locale}/about`, `/contact` | INDEX, FOLLOW | Commercial/trust content |
| `/{locale}/start-project` | INDEX, FOLLOW | Useful static entry point; the wizard's in-progress *state* has no separate URL (query params like `?from=ai` don't change the canonical — see §8) |
| `/{locale}/ai-consultant` | INDEX, FOLLOW | Static intro copy is genuinely useful; the *conversation itself* has no URL at all (session id lives in `sessionStorage` + POST bodies only — see Phase 6) |
| `/admin`, `/admin/*` | NOINDEX, NOFOLLOW | Internal tool. Enforced via `robots: {index:false,follow:false}` metadata on `src/app/admin/layout.tsx` **and** `robots.txt` disallow **and** real authentication (`src/lib/auth/dal.ts`) — three independent layers, but auth is the only one that actually stops anything |
| `/api/ai/consultant` | Excluded from sitemap/robots-allow | A Route Handler, not a page — nothing to index; disallowed in `robots.txt` as defense-in-depth |
| Future blog `DRAFT`/`REVIEW`/`ARCHIVED` posts | NOINDEX (never routed) | Only `PUBLISHED` posts will ever get a route or a sitemap entry — see `src/domain/blog-post.ts` |

## 4. Canonical URL system

One resolver, `src/lib/seo/site-url.ts`:
- `buildCanonicalUrl(locale, path)` — `${siteConfig.url}/${locale}${path}`. `siteConfig.url` (`NEXT_PUBLIC_SITE_URL`) is intentionally **not** read from the DB-backed effective-config (Phase 6) — site origin is infrastructure, not business-editable content.
- `buildAlternateLanguages(pathByLocale)` — takes the *already-localized* path per locale and adds `x-default`.
- `buildFixedPathAlternates(locale, path)` — convenience for the common case where the path segment is identical across every locale.

Every `generateMetadata` in the codebase now goes through these — refactored in this phase (previously each page inlined `Object.fromEntries(routing.locales.map(...))`).

**Query parameters never affect the canonical.** `generateMetadata` never reads `searchParams`, so `?from=ai`, `?utm_source=...`, etc. can never produce a second indexable canonical for the same page — this was already structurally true before Phase 7 (nothing needed to change), just verified and documented here (see §8 "Duplicate content").

## 5. Hreflang policy

- Locales: `fr`, `ar`, `en`, `de`.
- `x-default` points at the **French** version of the page (`routing.defaultLocale`) — Algeria-first launch, `fr` is next-intl's own default locale, and using anything else as `x-default` would contradict the routing config itself.
- Every alternate URL uses the correct **localized slug** for that language, not a shared/English slug — this is why `buildAlternateLanguages` takes a full `pathByLocale` map rather than a single path + locale list.
- `next-intl`'s automatic `Link` response header (`alternateLinks`) remains disabled (`src/i18n/routing.ts`, a Phase 3 decision) — it doesn't know about localized slugs and would emit an alternate URL that resolves to the wrong content. `generateMetadata`'s `alternates.languages` is the sole, authoritative hreflang source.

## 6. Sitemap architecture

`src/app/sitemap.ts`. Includes: home, the six fixed-segment pages, every service, every case study — for every locale, with full `alternates.languages` per entry. Excludes: `/admin/*`, the AI API route, any future non-`PUBLISHED` blog post, and — structurally, not by an exclusion rule — anything that isn't in the same static content maps the public pages themselves render from (there is no path by which a private/session-scoped URL could end up here).

`lastModified` is **omitted entirely**, on every entry. No content in this codebase carries a real per-entry "last edited" timestamp yet (service/case-study copy is versioned TypeScript, not a CMS row with `updatedAt`) — the previous implementation faked one with `new Date()` at build time, which is exactly the kind of fabricated freshness signal this document's rule #1 forbids. Add a real value once one exists (the future blog's `updatedAt` is the first candidate).

## 7. Robots.txt

`src/app/robots.ts`: `allow: "/"`, `disallow: ["/admin", "/api/"]`, points at the real sitemap. Explicitly documented in-code: **this is defense-in-depth, not the security boundary** — `/admin` is protected by real authentication regardless of what robots.txt says.

## 8. Global metadata & branding policy

- **Branding**: `siteConfig.name = "SIGMA+"` (the mark, used as the `" — SIGMA+"` suffix on every content page's title) vs. `siteConfig.legalName = "SIGMA+ Agency"` (used in copy like the footer's `© {year} {legalName}` and as the Organization schema's `name`). This split already existed; it's now the documented, intentional policy rather than an implicit convention.
- **No global title template** (`title: {template: ...}` in the Metadata API) — each page sets its own full, differentiated title (`"${page-specific copy} — SIGMA+"` for content pages; a few pages like Start a Project / AI Consultant set a complete branded title directly from their own messages, with no suffix, since their copy already reads naturally on its own). This avoids the "Page | Sigma Plus Agency" boilerplate-for-every-page anti-pattern the brief called out — verified via the audit engine (`npm run seo:audit` flags any duplicate title across pages, which a lazy template would produce immediately).
- **Google Search Console verification**: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, optional, only emitted into metadata when actually set (`src/app/[locale]/layout.tsx`). No placeholder token is ever committed.

## 9. Structured data

Centralized in `src/lib/seo/schema.ts` + the `<JsonLd>` wrapper (`src/components/seo/json-ld.tsx`). Entities cross-reference each other via stable `@id` values (`${url}#organization`, `${url}#website`) instead of repeating the full Organization object on every page — the homepage emits a `@graph` of `[Organization, WebSite]`; service/case-study pages emit their own node(s) that reference the Organization by `@id` rather than duplicating it.

Types used and why:
- **`ProfessionalService`** (an `Organization` subtype) for the business entity — SIGMA+ sells professional software services. Built from `getEffectiveSiteConfig()` (Phase 6), so an admin's `company_identity` setting change is reflected here too, not just in the visible contact info.
- **`WebSite`** — minimal, references the Organization as `publisher`. No `SearchAction`/sitelinks-search-box markup, since there is no site search feature to back it.
- **`Service`** per service page, referencing the Organization by `@id`.
- **`CreativeWork`** (not `SoftwareApplication`) per case-study page — a case study page is an editorial write-up about a delivered project, not the software itself, and SIGMA+ doesn't distribute these products for a visitor to install. Marking the page as a `SoftwareApplication` would misrepresent what the URL is.
- **`FAQPage`** on a service page only when that page's FAQ is actually visibly rendered (the same `content.faq` array drives both) — never added speculatively.
- **`BreadcrumbList`** — built once in `Breadcrumbs`, from the exact same `items` array that drives the visual breadcrumb trail, so the two can never drift apart.

**Never included, deliberately**: `aggregateRating`/`review` (no real reviews collected), `sameAs` (no real, configured social profiles yet), `logo` (no production logo asset yet — the code-drawn `SigmaMark` SVG component exists but isn't yet exported as a static asset URL suitable for this field), `foundingDate`/`numberOfEmployees` (not disclosed/verified). Adding any of these with placeholder values would violate rule #1 more than omitting them costs in schema completeness — add them for real once the underlying fact exists.

## 10. Internal linking

Audited via `runSeoAudit()`'s orphan-reachability check (`src/lib/seo/audit.ts`), which walks a modeled link graph from Home: header nav → all 6 top-level pages (+ the AI Consultant, which is header-reachable via every page's header even without its own nav link) → services index links every service, work index links every case study → each service links its `relatedServices` (from `src/content/services/meta.ts`) → each case study links its own services and the "next project" ring (which alone makes every case study reachable from any other). Currently: **zero orphans** (verified by `npm run seo:audit`).

The footer (`src/components/site-footer.tsx`) now also carries a compact nav (Services/Work/About/Contact) — added this phase purely to strengthen internal-linking depth site-wide (a second path to every top-level page from literally every page, not just the header).

## 11. Redirects & legacy migration

`src/config/legacy-redirects.ts` + `buildLegacyRedirectRules()` (`src/lib/seo/build-redirects.ts`), wired into `next.config.ts`'s `redirects()`. **Currently empty, deliberately**: per the Phase 0 audit, the old live site (`brahim-dev.vercel.app`) has no confirmed indexable subpage URLs at all — no sitemap, no robots.txt, and every local snapshot is a single-page app with in-page anchors, not real routes. There is nothing to verify a redirect *from*. Inventing service/project-level mappings would violate "do not invent redirects for URLs that never existed."

The only plausible future entry is the bare locale root, and only if/when the old domain is ever pointed at this app — a DNS/infrastructure decision for the owner, tracked in the master plan's open items, not something this codebase decides unilaterally.

Rule for any future entry: **direct, not chained** (A → C, never A → B → C) — `permanent: true` only, applied per-locale automatically by `buildLegacyRedirectRules`.

## 12. 404 / 410

- **404** (`src/app/[locale]/not-found.tsx`): brand-consistent, localized via `next-intl`, links to Home **and** Services/Work/Start a Project (not just Home) — Next.js returns a genuine HTTP 404 for this special file automatically.
- **410**: prepared but unused (`src/lib/seo/gone.ts` + doc comment) — there is no App Router file convention for emitting 410 from a Server Component, so the documented mechanism is a Route Handler for the specific removed path, or a `proxy.ts` interception for a removed section. Not wired to any real route, because nothing has actually been removed yet — using 410 without a real removed page was explicitly forbidden.

## 13. Algeria-first search-intent map (hypotheses, not verified data)

Every row below is a **hypothesis**, not a measured keyword — no volume/difficulty/ranking claim is made or implied anywhere in this table. Re-evaluate once Search Console data exists (see §16).

| Intent | Locale | Target page | Content gap today | Cannibalization risk |
|---|---|---|---|---|
| "création site web Algérie/Alger" | fr | Home, Web Development service | Home covers this broadly; the service page could add an Algeria-specific paragraph | Low — one clear target page each |
| "agence web Algérie/Alger" | fr | Home | Already the home page's core positioning | None |
| "développement application mobile Algérie" | fr | Mobile Applications service | Page exists, no explicit "Algeria" mention in body copy | Low |
| "création application mobile Algérie" | fr | Mobile Applications service | Same page as above — **risk**: don't create a second page for a near-identical phrase | Medium if a second page were created (don't) |
| "agence développement web Algérie" | fr | Home / Web Development | Overlaps two pages | Medium — pick one primary target, cross-link |
| "développement logiciel Algérie" | fr | SaaS & Platforms / Backend & API services | Neither page explicitly targets "logiciel" framing | Low |
| "site e-commerce Algérie" / "création boutique en ligne Algérie" | fr | E-commerce service | Page exists, generic copy | Low |
| "agence digitale Algérie" | fr | Home | Broad positioning term | None |
| "AI agency Algeria" | en | AI & Automation service | English copy exists; no explicit "Algeria" framing | Low |
| "automatisation entreprise Algérie" | fr | Automation service | Page exists | Low |

Policy for acting on this table: adjust **existing page copy** to naturally include these phrases where genuinely relevant (no keyword stuffing — rule #1). **Do not** create one page per keyword variation; several rows deliberately share a target page for exactly this reason.

## 14. Local SEO policy — anti-spam

**Do not** create `/agence-web-alger`, `/agence-web-oran`, `/agence-web-constantine`, or any other city-doorway page, fake office address, fake Google Business location, or city-spam page cluster. None currently exist. This is a standing prohibition, not a Phase 7-only note — a future phase must not "productivity-hack" local SEO this way even under ranking pressure. Real, future location pages are architecturally fine *if* SIGMA+ has a genuinely unique reason and unique content per location (e.g. an actual local team, a real case study cluster) — that bar has not been met yet.

## 15. SEO audit engine

`src/lib/seo/audit.ts`'s `runSeoAudit()` — fully deterministic, offline, no external API, no AI call, no browser. Reads `src/lib/seo/site-model.ts`'s `buildSiteModel()` (every known page × every locale, built from the same content-layer functions and raw `messages/*.json` reads the real pages use — no next-intl/server, no DB, so it runs equally from a plain script or a Next server component).

Checks implemented: duplicate/missing/too-short/too-long titles and descriptions, duplicate canonical URLs (slug collisions), translation-key parity across `messages/*.json`, orphan-page reachability, empty case-study narrative sections, `<h1>` presence/duplication (static source scan — best-effort, see caveat below), and broken `relatedServices`/case-study-service references.

Every finding is `SeoIssue { id, type: ERROR|WARNING|OPPORTUNITY, page, locale?, message, recommendation, source: "INTERNAL_AUDIT", detectedAt }` (`src/domain/seo-issue.ts`). Provenance is always `INTERNAL_AUDIT` this phase — the fuller vocabulary (`LIVE_VERIFIED`, `OFFICIAL`, `CONNECTED_DATA`, `ESTIMATE`, `AI_RECOMMENDATION`) is defined for Phase 8+ once real external connections exist, and must never be used to dress up an assumption as a fact.

**Caveat**: the `<h1>` check reads `.tsx` source files directly (`fs.readFileSync`) — this works in `npm run seo:audit` (dev/CI, full source tree present) and in local `next dev`/`next start`, but a deployed serverless bundle may not include raw source files, in which case this one check silently reports nothing rather than crashing (guarded with `fs.existsSync`/try-catch). Treat `npm run seo:audit` as the authoritative run of this particular check.

### Issue workflow (prepared, not persisted)

Statuses `OPEN | ACKNOWLEDGED | RESOLVED | IGNORED` are defined (`src/domain/seo-issue.ts`) but **not persisted to a database this phase** — the audit is cheap enough (a few hundred milliseconds, pure computation) to just re-run rather than needing to remember "someone looked at this already" across runs. A future `seo_issue_status` table (keyed by a stable issue fingerprint, not the ephemeral `id`) is the natural next step once issue volume or a real workflow (assigning issues, tracking dismissals) justifies it.

## 16. External integration adapters (all: not connected)

Three boundary modules, each returning `{connected:false}` until real credentials exist — none fake connected data:
- `src/lib/seo/adapters/search-console.ts` — future GSC queries/pages/clicks/impressions/CTR/average position/indexing diagnostics. `GOOGLE_SEARCH_CONSOLE_SITE_URL` + `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`.
- `src/lib/seo/adapters/analytics-reporting.ts` — future GA4 Data API reporting (sessions, conversions, landing-page performance). Deliberately distinct from `src/lib/integrations/analytics.ts`'s `track()`, which is outbound event tracking and has nothing to do with reading data back. `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_CREDENTIALS_JSON`.
- `src/lib/seo/adapters/pagespeed.ts` — future PageSpeed Insights/Lighthouse data. `PAGESPEED_API_KEY`.

The Admin → SEO page (`/admin/seo`) surfaces all three as "Not connected" today — that is the honest, correct state.

## 17. Core Web Vitals — architectural risk review (no measured data)

**No CWV metric in this document is a measurement** — no Lighthouse run, no CrUX data, no PageSpeed API call was made (no credentials configured, and none required for Phase 7). This is a risk review of the implementation only.

- **Flagship 3D hero (Phase 2)**: already lazy-loaded and capability-gated (`src/components/hero/`), with a static fallback when WebGL/reduced-motion isn't available — the hero's headline/CTA copy is real HTML present in the initial render regardless of whether Three.js loads at all (re-confirmed this phase, no regression). Low LCP risk by design; the 3D object itself is never the LCP element (the headline text is).
- **Fonts**: `next/font/google` (Geist), self-hosted at build time — no external font request, no FOUT/CLS risk from a third-party font CDN.
- **Images**: **zero `<img>` or `next/image` usage anywhere in the public site today** (verified via a full source grep this phase) — all visuals are procedural SVG/Three.js/CSS, consistent with the project's "no fake product screenshots" content policy. This is good for LCP/CLS (no image-loading bottleneck) but means §35 "Image SEO" has nothing to audit yet; apply `next/image`, meaningful `alt` text, and lazy-loading-below-the-fold once real project imagery is ever added (tracked as NEEDS USER DATA in the master plan already).
- **Client hydration**: the Project Builder and AI Consultant are the two heaviest client-side experiences, each isolated to its own route (`/start-project`, `/ai-consultant`) — neither loads on the homepage or service/case-study pages, so their hydration cost doesn't tax the pages that matter most for organic entry.
- **Admin**: explicitly out of scope for public CWV (noindex, authenticated, not a ranking surface).
- **New this phase — OG image generation**: `src/app/[locale]/{opengraph-image,services/[slug]/opengraph-image,work/[slug]/opengraph-image}.tsx` use `next/og`'s `ImageResponse`, which Next statically optimizes (generated once at build time when the inputs are static/cacheable) — this does not add a runtime cost to page loads; it only affects how a shared link preview renders.

## 18. Open Graph images

`src/lib/seo/og-image.tsx` — one shared, programmatic renderer (`next/og`'s `ImageResponse`, Satori) used by the default site card, every service page, and every case-study page. Brand-typographic (SIGMA+ mark + title on the dark/electric-blue palette), matching the existing "no fake product screenshots" policy rather than a fabricated product photo.

**Arabic**: Satori (the renderer behind `next/og`) does not correctly shape Arabic script — rendering Arabic text would produce visually broken output. For `locale === "ar"`, the OG image renders the brand-only card with no page-specific text, a deliberate graceful fallback rather than garbled output. This is a known, documented limitation, not an oversight.

## 19. Language quality

`lang`/`dir` are set explicitly per locale in `src/app/[locale]/layout.tsx` (`lang={locale}`, `dir={rtlLocales.has(locale) ? "rtl" : "ltr"}`) — never inferred from CSS. This predates Phase 7 and was reconfirmed, not changed.

## 20. Duplicate content / facet indexing

- `/` vs `/fr`: `next-intl`'s own middleware (`src/proxy.ts`) handles the bare-root → default-locale resolution; there is no separately-indexable bare-`/` page to duplicate `/fr`.
- Query parameters (`?from=ai`, `utm_*`): never read by any `generateMetadata`, so they can never produce an alternate canonical (see §4).
- Work/project filters: **none exist** — the Work index page lists every case study with no client-side filter UI, so there is no facet/filter query-parameter space to canonicalize. Revisit this section if filtering is ever added.

## 21. Future blog architecture (types only — no content, no route)

`src/domain/blog-post.ts`: `BlogPost` type (id, category, status, locale, slug, title, description, content, author, publishedAt/updatedAt, optional canonicalOverride/ogImage, relatedServices/relatedCaseStudies), `BLOG_CATEGORIES` (web, mobile, ai, automation, e-commerce, seo, business-technology, case-studies), `CONTENT_STATUSES` (`DRAFT`/`REVIEW`/`PUBLISHED`/`ARCHIVED`). **No content exists, no `/blog` route exists, nothing is wired into the sitemap** — `isPublished()` is the one function that will gate sitemap inclusion once real posts exist, per the explicit "do not populate dozens of AI-generated articles" instruction.

## 22. Known limitations

- No browser-rendered visual QA was performed this phase (durable no-E2E policy) — verified at the application/integration level (`npm run seo:audit`, Vitest, a real `next build`) instead.
- Two Arabic service meta descriptions are shorter than the recommended minimum (flagged by the audit, not fixed — a content-copy decision, not a code defect).
- Several page descriptions run long enough to risk truncation in search results (flagged, not rewritten this phase — editorial call).
- The `<h1>` audit check depends on the raw source tree being present at run time — reliable for `npm run seo:audit` and local dev, not guaranteed for every deployment target.
- No `logo`/`sameAs` in the Organization schema (no real assets/profiles yet — see §9).
- SEO issue workflow statuses are defined but not persisted (see §15) — acceptable at current issue volume.
- Local/Algeria keyword table is hypothesis-only; no real search-volume or ranking data exists yet.

## 23. Measurement plan (once external access exists)

1. Verify domain ownership in Google Search Console → configure `GOOGLE_SEARCH_CONSOLE_*` env vars → `src/lib/seo/adapters/search-console.ts` starts returning real query/page/CTR/position data instead of `{connected:false}`.
2. Configure GA4 property + service account → `GA4_*` env vars → `analytics-reporting.ts` real conversions/landing-page data.
3. Configure `PAGESPEED_API_KEY` → `pagespeed.ts` real LCP/CLS/INP numbers, replacing the architectural risk review in §17 with actual measurements.
4. Re-evaluate the §13 keyword hypotheses against real Search Console query data — promote confirmed high-value phrases, drop ones with no real signal, and only then consider whether any genuinely deserve their own page (still subject to §14's anti-doorway-page policy).
