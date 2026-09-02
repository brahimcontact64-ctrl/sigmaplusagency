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

## 21. Insights/CMS content system (Phase 8 — supersedes the Phase 7 placeholder)

The Phase 7 `src/domain/blog-post.ts` types-only placeholder has been **replaced** by a real, DB-backed implementation — see §24 below for the full architecture. That file no longer exists.

## 24. Insights/CMS content system (Phase 8)

### Content model

`src/domain/article.ts`: `Article` (the stable, locale-independent identity — type/category/tags/author/featured/relatedServices/relatedCaseStudies) and `ArticleTranslation` (everything editorial and per-locale — status/slug/title/description/excerpt/content/seoTitle/seoDescription/ogImage/publishedAt). **Status lives on the translation, not the parent** — this is what makes "a French article exists, Arabic doesn't yet" possible without contradiction (Phase 8 §9). `ARTICLE_TYPES` = `ARTICLE`/`GUIDE`/`CASE_STUDY_EDITORIAL` (kept deliberately separate from the existing project Case Study domain — a case-study *editorial* article is not the same entity as a delivered-project case-study page). `ARTICLE_CATEGORIES` = web/mobile/ai/automation/ecommerce/seo/business-technology/case-studies.

### Storage

Postgres via Drizzle, additive migration `0004_clumsy_random.sql`: `articles`, `article_translations` (unique on `(locale, slug)` and on `(article_id, locale)`), `article_slug_redirects`. Tags/related-services/related-case-studies are `jsonb` arrays on `articles`, not join tables — the same pattern already used for `project_requests`' goals/capabilities/platforms; normalizing further wasn't justified at this content volume. The repository/service boundary (`ArticleRepository`/`ArticleService`) is the only thing public pages and the admin UI touch — a future headless CMS could replace the storage behind that boundary without changing either.

### Anti-chain slug redirects (§15)

`article_slug_redirects` maps an **old slug directly to the article**, never to another slug string. Resolving a redirect always looks up that article's *current* slug at request time — so a slug changed twice (A → B → C) redirects A straight to C with no intermediate hop and no stale "B" row to maintain. Verified with a dedicated test (`tests/integration/article-repository.test.ts`).

### Editorial workflow / RBAC (§56)

`DRAFT → REVIEW → PUBLISHED → ARCHIVED`, enforced server-side in `ArticleService`/`ArticleRepository.changeStatus` — `publishedAt` is set exactly once (first publish) and preserved across unpublish/republish. Publishing runs `validateForPublish()` (title/description/content/slug must be non-empty; no arbitrary SEO character-count hard block, per the brief). `CONTENT_EDITOR_ROLES` = OWNER/ADMIN/EDITOR (this is the first real use of the `EDITOR` role, defined since Phase 5 but unused until now) — SALES explicitly cannot publish content even though it can act on leads; every admin role can at least view the list. Admin UI: `/admin/content` (list + filters), `/admin/content/new`, `/admin/content/[id]` (article-level meta), `/admin/content/[id]/[locale]` (the translation editor), `/admin/content/[id]/[locale]/preview` (auth-only preview, no separate token system, never indexable).

### Content sanitization (§12/§64)

Body content is **Markdown, never raw HTML** — rendered via `react-markdown` (`src/components/content/article-body.tsx`) with `skipHtml` and no `rehype-raw`-style plugin, which is what actually prevents a stored `<script>`/inline event handler from ever executing (it renders as literal escaped text). The one other injection surface — a `javascript:`/`data:`/`vbscript:` URL in a markdown link or image — is blocked by an allowlist (`src/lib/content/sanitize-url.ts`, kept dependency-free specifically so it stays unit-testable, same pattern as `rbac.ts`/`model-config.ts`). No new markdown-to-HTML-with-sanitizer dependency was needed; `react-markdown`'s default (HTML-off) behavior is the actual safety mechanism.

### Public routes

`/[locale]/insights` (index: featured + recent + category filter, canonical always the clean index regardless of `?category`/`?page` — deliberately, to avoid diluting the index's own ranking signal across thin filtered slices, same principle as Phase 7's facet-indexing policy) and `/[locale]/insights/[slug]` (article detail: Article + Organization JSON-LD, related services/case studies, recent articles, the same commercial CTA every content page ends on). Both are `export const dynamic = "force-dynamic"` — deliberately **not** statically prerendered, since this is live-editable CMS content and a newly published article must appear without a redeploy. A localized RSS feed (`/[locale]/insights/rss.xml`) was added since it was genuinely low-cost (one Route Handler, no new dependency, reuses the existing `listPublished` query).

### Multilingual hreflang for partial translations (§9/§16)

`buildPartialAlternateLanguages()` (`src/lib/seo/site-url.ts`) only ever declares an alternate for a locale that actually has a **published** translation — never a fabricated route for a missing/unpublished one. `x-default` falls back to the first published locale (in `routing.locales` order) when the default locale (`fr`) itself isn't published yet, so there's always an x-default rather than omitting it.

### Article SEO / structured data (§16-17)

`buildArticleSchema()` (`src/lib/seo/schema.ts`) uses only real values: `datePublished`/`dateModified` from the translation's own timestamps (datePublished is *omitted* — not fabricated — for a not-yet-published draft being previewed), `author`/`publisher` both reference the single Organization `@id` (no invented staff writer — SIGMA+ is the only author that exists, per §18), `image` omitted unless a real `ogImage` was set. Article OG images (`/[locale]/insights/[slug]/opengraph-image.tsx`) reuse the same shared renderer from Phase 7, with the same Arabic-script fallback.

### Sitemap integration (§58)

`src/app/sitemap.ts`'s `articleEntries()` includes one entry per article per its *published* locale peers only, with a **real `lastModified`** from `article_translations.updated_at` — the first genuinely non-fabricated freshness signal in this codebase's sitemap (everything else still correctly omits it, per Phase 7 policy, since it has no real timestamp to report). A database failure here is caught and logged, never allowed to take down the rest of the sitemap (same resilience pattern as `effective-config.ts`). Split into a DB-free `buildStaticSitemapEntries()` and a DB-backed, dependency-injectable `articleEntries(repo)` specifically so the static-content tests stay hermetic while the article behavior (including DB-failure resilience) is still directly tested against an isolated PGlite instance.

### SEO audit engine — now understands Insights (§66)

`runSeoAudit()` is now `async`: it merges the static site model with a live query of published articles (`buildArticleModel()`) before running every existing check (duplicate/missing metadata, duplicate canonicals, orphan pages, etc.) against the combined set, plus one new check (`checkArticles`) for duplicate published slugs and broken `relatedServices`/`relatedCaseStudies` references. **Draft privacy is structural, not a bolted-on check** — `listAllPublishedTranslations()`'s own query filters to `PUBLISHED`, so a DRAFT/REVIEW/ARCHIVED translation cannot appear in the audit's page model at all, verified by the repository test suite rather than by trying to catch a leak after the fact. A database failure while reading articles degrades to a single WARNING issue rather than crashing the whole audit.

## 25. SEO intelligence layer (Phase 8)

### Domain model

`src/domain/seo-intelligence.ts`: `SeoConnectionState` (provider/status/propertyIdentifier — never a credential — /lastSyncedAt/lastError), `SeoPageMetric`/`SeoQueryMetric` (Search Console-shaped, every value carries a mandatory `dateRange`), `SeoAnalyticsPageMetric` (GA4-shaped), `PageSpeedMetric` (explicit `FIELD`/`LAB` `kind`, never merged), `SeoOpportunity` (deterministic-rule output, always carries `confidence` + `evidence` + `dateRange`), `SeoRecommendation` (the approval-first workflow object). `src/domain/seo-issue.ts`'s provenance vocabulary was updated to the concrete set the brief specified: `INTERNAL_AUDIT`, `GOOGLE_SEARCH_CONSOLE`, `GOOGLE_ANALYTICS`, `PAGESPEED`, `MANUAL`, `ESTIMATE`, `AI_RECOMMENDATION` — an opportunity/recommendation's `source` field must be one of these, never blurred.

### Connection state (§31/§33/§41/§51)

Upgraded the Phase 7 boolean adapters into real, persisted connection state (`seo_connections` table — provider/status/propertyIdentifier/lastSyncedAt/lastError, **never a credential or token**). Each adapter (`search-console.ts`/`analytics-reporting.ts`/`pagespeed.ts`) now: reports `NOT_CONFIGURED` honestly with no credentials; reports an explicit `ERROR` (with a real message) if credentials exist but the real API client isn't implemented yet — **never a silent `NOT_CONFIGURED` once credentials are present**, since that would hide a real misconfiguration; and exposes an idempotent `sync*()` function (`syncSearchConsole`/`syncAnalyticsReporting`/`syncPageSpeed`) safe to call repeatedly or from a future cron, which never fabricates metric rows while disconnected. No OAuth token storage was implemented this phase (§51's explicit fallback: "leave the integration disconnected rather than using an unsafe shortcut").

### Opportunity engine (§36-39)

`src/lib/seo/opportunity-engine.ts` — five pure, fully unit-tested functions, every one returning `[]` when given no/insufficient data rather than fabricating a finding: `detectHighImpressionsLowCtr`, `detectMidRankingPositions` (never claims Search Console's *average position* is a guaranteed rank), `detectCannibalization` (only flags a query when no single page dominates AND a real runner-up share exists above a threshold — verified by a test that a dominant-page scenario is correctly *not* flagged), `detectContentDecay` (refuses to compare date ranges of different lengths — the brief's explicit "7 days vs 90 days" example is a dedicated test case), and `recommendationsFromAuditIssues` (the one rule that runs today with zero external connections: turns Phase 7's existing WARNING/OPPORTUNITY audit findings into draft recommendations — an ERROR is never turned into a "recommendation," since a bug should just be fixed directly).

### Approval-first recommendations (§42-43)

`seo_recommendations` table + `SeoRecommendationService`: `RECOMMENDED → APPROVED` or `RECOMMENDED → REJECTED`, both requiring an explicit admin actor (`SEO_EDITOR_ROLES` = OWNER/ADMIN — tighter than general content editing) and producing an audit-log entry. **Nothing in this codebase can reach `APPROVED` without that explicit action, and reaching it never itself rewrites a title, publishes an article, or changes a canonical/redirect** — it only records that a human signed off on the idea. Verified by a test asserting an already-`APPROVED` item can't be silently re-approved past its own state machine.

### Admin SEO page — expanded

`/admin/seo` now has Connections (truthful NOT_CONFIGURED/CONNECTED/ERROR/EXPIRED state, never shown as healthy without a real sync), Search Performance and PageSpeed (explicit "Not connected" empty states — no fake charts), Content (real published/review/draft/archived counts from the CMS), Opportunities (the `RECOMMENDED` queue with Approve/Reject actions and a "Generate from audit" button), and the original Technical Audit table.

### Prepared, not implemented this phase

- `SeoCompetitor` type + a manual-entry-only model (§46) — no scraping, no automatic competitor inference.
- `KeywordProvider` interface (§45) — the Algeria hypotheses in §13 remain hypotheses; no real keyword-research vendor is connected.
- `seo_metric_snapshots`-style persistence (§47) — deliberately **not** added as a table this phase (no real sync populates it yet, so an empty schema would be speculative); the metric *shapes* (`SeoPageMetric` etc.) exist so a real sync has something concrete to return once one exists.

## 26. Known limitations

- No browser-rendered visual QA was performed in Phase 7 or 8 (durable no-E2E policy) — verified at the application/integration level (`npm run seo:audit`, Vitest, a real `next build`) instead.
- Several page descriptions/titles run long enough to risk truncation in search results (flagged by the audit, not rewritten — editorial call, not a code defect). The two Arabic short-description warnings from Phase 7 were fixed with real, grounded copy (see the Phase 8 report in the master plan).
- The `<h1>` audit check depends on the raw source tree being present at run time — reliable for `npm run seo:audit` and local dev, not guaranteed for every deployment target.
- No `logo`/`sameAs` in the Organization schema (no real assets/profiles yet — see §9).
- SEO issue workflow statuses (Phase 7, `SeoIssue`) remain unpersisted; SEO *recommendation* statuses (Phase 8, `SeoRecommendation`) now are — these are two different, intentionally separate concepts (see §15 vs §25).
- Local/Algeria keyword table is hypothesis-only; no real search-volume or ranking data exists yet.
- `runSeoAudit()`/`sitemap()`/the SEO adapters read through their real repository singletons (not dependency-injected) when called from `npm run seo:audit` or `/admin/seo` — correct for auditing genuinely live content, but means a local dev database with manually-created test articles could in principle influence those specific runs. A fresh CI checkout is unaffected (`.data/` is gitignored). The article-content *tests* avoid this by injecting an isolated `createTestArticleRepository` instance directly.
- No seed articles were published this phase (zero is an explicitly acceptable outcome per the brief) — the content system is verified via the test suite and the admin editor UI, not via example content.
- Insights pagination/category filtering is fully built but untested against real volume (zero published articles today) — revisit page-size and canonical-per-page behavior once real content exists.

## 27. Measurement plan (once external access exists)

1. Verify domain ownership in Google Search Console → configure `GOOGLE_SEARCH_CONSOLE_*` env vars → `src/lib/seo/adapters/search-console.ts` moves from `NOT_CONFIGURED`/`ERROR` to real `CONNECTED` state and `syncSearchConsole()` starts returning real page/query metrics instead of `[]`.
2. Configure GA4 property + service account → `GA4_*` env vars → `analytics-reporting.ts` real conversions/landing-page data.
3. Configure `PAGESPEED_API_KEY` → `pagespeed.ts` real LCP/CLS/INP field/lab data, replacing the architectural risk review in §17 with actual measurements.
4. Once real Search Console data exists, run the opportunity engine (`src/lib/seo/opportunity-engine.ts`) against it for real — `detectHighImpressionsLowCtr`/`detectMidRankingPositions`/`detectCannibalization`/`detectContentDecay` are already implemented and tested against synthetic data, waiting only for real input.
5. Re-evaluate the §13 keyword hypotheses against real Search Console query data — promote confirmed high-value phrases, drop ones with no real signal, and only then consider whether any genuinely deserve their own page (still subject to §14's anti-doorway-page policy).

## 28. SEO job orchestration & automation (Phase 12)

Turns the intelligence layer above from "run manually from /admin/seo"
into a real, schedulable production system — without connecting a
single external account, spending an API credit, or activating a cron
job. Everything in this section is **prepared, not activated**; see
"Production activation steps" below for what an OWNER still has to do
explicitly.

### Architecture

```
src/domain/seo-job.ts                    job types/statuses/counts (pure types)
src/lib/repositories/seo-job-repository.ts   persistence: one row per run (seo_job_runs)
src/lib/seo/jobs/run-job.ts               shared orchestrator: lock, timing, structured logs, history
src/lib/seo/jobs/<job-name>.ts            one function per job type — thin, calls existing services/adapters
src/lib/seo/jobs/index.ts                 SEO_JOB_DISPATCH — the one job-type → function map
src/lib/seo/providers/keyword-provider.ts SERP/keyword abstraction (Phase 8 §45, filled in properly)
src/lib/seo/services/weekly-report.ts     deterministic weekly report builder
src/lib/notifications/seo-notification-service.ts   reuses the existing Resend-backed email plumbing
src/app/api/internal/seo/run/route.ts     the one protected trigger point (cron or manual)
src/lib/security/cron-auth.ts             constant-time CRON_SECRET check
```

8 job types (`SEO_JOB_TYPES` in `domain/seo-job.ts`) — the 7 the brief
named plus `WEEKLY_EXECUTIVE_REPORT` as its own schedulable unit (it
has a distinct weekly cadence and its own persisted snapshot, so
folding it into another job would have hidden its own history):

`DAILY_TECHNICAL_AUDIT`, `DAILY_SEARCH_CONSOLE_SYNC`, `DAILY_ANALYTICS_SYNC`, `WEEKLY_PAGESPEED_AUDIT`, `WEEKLY_KEYWORD_ANALYSIS`, `WEEKLY_SEO_OPPORTUNITY_ANALYSIS`, `WEEKLY_CONTENT_DECAY_ANALYSIS`, `WEEKLY_EXECUTIVE_REPORT`.

Every job is a thin wrapper around infrastructure that already existed
(the Phase 7 audit, the Phase 8 adapters/opportunity engine, the Phase
9 first-party analytics) — `run-job.ts` never contains any SEO logic
itself, only orchestration (lock → run → record).

### Reliability

- **Idempotency/locking — DB-enforced, atomic across instances**: the
  first version of this (pre-commit-review) was a plain application-
  level check-then-insert (`SELECT` for an active run, then `INSERT` if
  none found), which is **not** atomic — two concurrent serverless
  instances (simultaneous cron delivery, or a manual "Run now" racing
  the cron) could both observe "nothing running" before either had
  written anything, and both start. Fixed before commit with a
  **partial unique index**: `UNIQUE (job_type) WHERE status = 'RUNNING'`
  (`seo_job_runs_one_running_per_type_idx`, schema.ts). `acquire()`
  (seo-job-repository.ts) now works by *attempting* the `INSERT`
  directly and treating a `23505` unique-violation as "already
  running" — the database itself is the lock, not a race-prone read
  beforehand. Proven, not just asserted: `tests/integration/
  seo-job-repository.test.ts` fires 10 genuinely concurrent (`Promise.
  all`, not sequential `await`s) `acquire()` calls for the same job
  type and asserts exactly one wins.
  - **No open transaction spans the external job**: `acquire()`'s
    insert and the later `complete()` update are each their own short,
    auto-committed statement — nothing wraps them (and the job body in
    between) in a single `db.transaction()`. A slow/hanging GSC/
    PageSpeed/SERP/AI call therefore never holds a Postgres connection
    open, which matters specifically for Supabase's pooler under
    Vercel's serverless model (a held-open transaction across an
    external call would starve the pool under concurrent invocations).
  - **Stale reclaim uses the database's own clock, not the caller's**:
    the reclaim `UPDATE`'s `WHERE` clause is `started_at < now() -
    make_interval(mins => 30)`, evaluated inside Postgres — never a
    `Date` computed in the Node process. The reclaim step is itself
    race-safe via ordinary Postgres row-level locking (if two workers
    run it at once, at most one actually flips the row — the second's
    `WHERE status = 'RUNNING'` no longer matches once the first
    commits); the partial unique index in step two is what actually
    guarantees only one worker proceeds to a live RUNNING row either
    way. Also proven in `seo-job-repository.test.ts` (two concurrent
    `acquire()` calls against the same stale row — exactly one wins).
  - **Job status is a closed, DB-enforced set**: `RUNNING`,
    `SUCCEEDED`, `FAILED`, `PARTIAL`, `TIMED_OUT` — enforced both by the
    TS union (`SeoJobStatus`) and a Postgres `CHECK` constraint on the
    column (defense-in-depth against a future direct-SQL mistake,
    added while the migration was still unapplied so it was free). No
    `SKIPPED` status: a rejected acquire attempt never gets a row at
    all, so there's nothing for one to describe.
- **One provider's failure never corrupts another job's data**: each
  job only ever touches its own provider(s); a `syncSearchConsole()`
  error doesn't affect the PageSpeed job's run.
- **NOT_CONFIGURED vs. a real degraded state**: a job whose provider
  isn't configured yet completes `SUCCEEDED` (correctly determined
  there was nothing to sync) — only a real `ERROR`/`EXPIRED` connection
  status (credentials present but broken) marks a run `PARTIAL`, so a
  genuine misconfiguration stays visible without every routine "not
  connected yet" run looking like a failure.
- **Job audit history is never deleted** — `/admin/seo`'s "Recent Job
  Runs" reads the same table directly.
- **Structured, redacted logs** via the existing observability logger
  (`src/lib/observability/logger.ts`, Phase 9) — every job run gets a
  `correlationId` (= its `runId`), and error summaries are redacted
  (connection strings/bearer tokens stripped) before being logged or
  persisted.

### Recommendation dedup fix

`SeoRecommendationService.generateFromAudit`/`generateFromOpportunities`
now check `findOpenDuplicate(type, page, locale)` before creating a
row — a repeated/scheduled run finding the same issue again is
skipped, not duplicated. A row a human already approved/rejected/
published never blocks a fresh finding of the same issue later (see
`seo-recommendation-repository.ts`'s doc comment). This closes the gap
that used to be documented here as a known limitation.

### SERP/keyword provider (Phase 8 §45, filled in)

`KeywordProvider` (domain/seo-intelligence.ts) now has a real shape —
`checkPositions(seeds): Promise<SeoKeywordCheck[]>` returning
`{keyword, country, language, position?, competingDomains, serpUrl?,
checkedAt, source}` — and a connection-state adapter
(`getKeywordProviderConnection()`) following the exact same honesty
policy as GSC/GA4/PageSpeed. No vendor is implemented; `SERP_PROVIDER`/
`SERP_API_KEY` unset (or `SERP_PROVIDER=NONE`) → `NOT_CONFIGURED`. The
§13 Algeria keyword hypotheses now also exist in code
(`src/config/keyword-hypotheses.ts`) as the real seed list the weekly
keyword-analysis job will check once a provider exists — they remain
**hypotheses** until then.

### Weekly executive report

`src/lib/seo/services/weekly-report.ts` builds a deterministic report
from real, already-tested sources only: `GrowthAnalyticsService`
(first-party sessions/leads/proposals/WhatsApp/AI-assisted/won, plus
the `organic_search` channel row from `getAcquisitionBreakdown` — the
real, honest "SEO commercial intent" signal, since GSC isn't connected
yet), the SEO connection states, the recommendation queue, and recent
job history. AI (when `ANTHROPIC_API_KEY` is configured) is given only
these already-computed numbers and asked to explain them in plain
language — it is structurally unable to introduce a new metric, since
it never receives anything else. The report is persisted as the
`WEEKLY_EXECUTIVE_REPORT` job's own `reportSnapshot` (no separate
reports table was needed).

**Known limitation**: the per-channel conversion *funnel* (started →
completed → proposal per traffic source) isn't available yet — `page_
view` doesn't carry UTM dimensions (a pre-existing Phase 9 limitation,
see `docs/ANALYTICS_MEASUREMENT_PLAN.md`), so only the lead-level
organic-search count is real and reported; a fabricated per-channel
funnel is never substituted.

### Autonomy policy (unchanged from Phase 8, now enforced structurally by what jobs are allowed to call)

**AUTO** (every job in this phase does only this): collect data, run
audits, detect problems, create `RECOMMENDED` rows, send internal
alerts. **REQUIRE APPROVAL** (nothing here does this — still only
`SeoRecommendationService.approve()`, an explicit admin action):
change title/meta, modify published copy, publish an article, change
canonical/hreflang, create a redirect, change indexability, change
Schema.org content, create a landing page. **NEVER AUTO**: spam pages,
fake reviews/locations, purchased/generated backlinks, keyword
stuffing, mass low-quality AI content — none of this phase's code path
can reach any of these regardless of input, since nothing here writes
to public content at all.

### Notifications

`src/lib/notifications/seo-notification-service.ts` reuses the exact
Resend-backed plumbing `lead-notification-service.ts` already uses
(same `LEAD_NOTIFICATION_EMAIL`/`LEAD_NOTIFICATION_FROM_EMAIL`, no new
vendor). Alert kinds: `critical_indexing_failure`, `sitemap_failure`,
`large_ranking_loss`, `severe_traffic_drop`, `cwv_regression`,
`weekly_report_ready` — only the last is actually wired to a trigger
this phase (the weekly report job); the others are prepared but have
no real data source to trigger them from yet (GSC/PageSpeed aren't
connected). A notification failure is always caught and logged,
never allowed to fail the job it's attached to.

### Environment variables (new this phase)

| Variable | Required? | Purpose |
|---|---|---|
| `CRON_SECRET` | For cron only | Authorizes `/api/internal/seo/run` (`Authorization: Bearer <value>`). Missing → every request rejected. |
| `SERP_PROVIDER` | No | Names a SERP vendor once one is chosen. Unset/`NONE` → honest `NOT_CONFIGURED`. |
| `SERP_API_KEY` | No | Paired with `SERP_PROVIDER`. Never logged. |

(`GOOGLE_SEARCH_CONSOLE_*`, `GA4_*`, `PAGESPEED_API_KEY` already existed — see §16/§25.)

### Production activation steps (NOT done by this phase — requires explicit OWNER approval)

1. Generate a real secret: `openssl rand -base64 32` → set as `CRON_SECRET` in Vercel's project environment variables (Production scope).
2. Add cron entries to `vercel.json` (create it if absent), one per job type, e.g.:
   ```json
   {
     "crons": [
       { "path": "/api/internal/seo/run?job=DAILY_TECHNICAL_AUDIT", "schedule": "0 3 * * *" },
       { "path": "/api/internal/seo/run?job=DAILY_SEARCH_CONSOLE_SYNC", "schedule": "15 3 * * *" },
       { "path": "/api/internal/seo/run?job=DAILY_ANALYTICS_SYNC", "schedule": "30 3 * * *" },
       { "path": "/api/internal/seo/run?job=WEEKLY_PAGESPEED_AUDIT", "schedule": "0 4 * * 1" },
       { "path": "/api/internal/seo/run?job=WEEKLY_KEYWORD_ANALYSIS", "schedule": "15 4 * * 1" },
       { "path": "/api/internal/seo/run?job=WEEKLY_SEO_OPPORTUNITY_ANALYSIS", "schedule": "30 4 * * 1" },
       { "path": "/api/internal/seo/run?job=WEEKLY_CONTENT_DECAY_ANALYSIS", "schedule": "45 4 * * 1" },
       { "path": "/api/internal/seo/run?job=WEEKLY_EXECUTIVE_REPORT", "schedule": "0 5 * * 1" }
     ]
   }
   ```
   Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
   its own scheduled invocations when `CRON_SECRET` is set — no
   additional wiring needed for Vercel Cron specifically.
3. Deploy. Verify with a manual, authenticated `curl` (never commit the
   secret): `curl -X GET "https://<domain>/api/internal/seo/run?job=DAILY_TECHNICAL_AUDIT" -H "Authorization: Bearer <CRON_SECRET>"`.
4. Watch `/admin/seo`'s "Recent Job Runs" for the first few scheduled
   firings before trusting the schedule unattended.
5. Only once real value is confirmed: configure `GOOGLE_SEARCH_CONSOLE_*`/`GA4_*`/`PAGESPEED_API_KEY`/`SERP_PROVIDER`+`SERP_API_KEY` one at a time (§27's existing measurement plan), re-verifying `/admin/seo`'s Connections panel shows real `CONNECTED` after each.

### Known limitations (Phase 12)

- No real GSC/GA4-reporting/PageSpeed/SERP vendor is implemented —
  every job that depends on one runs today and honestly reports
  `NOT_CONFIGURED`, never a fabricated result. This was a deliberate
  scope boundary (no Google account connection, no API spend, no
  invented data), not an oversight.
- `sitemap_failure`/`critical_indexing_failure`/`large_ranking_loss`/
  `severe_traffic_drop`/`cwv_regression` alerts are wired end-to-end
  (the sending mechanism) but have no real trigger condition yet —
  they need real GSC/PageSpeed/analytics data to detect against.
- The weekly report's organic-traffic signal is lead-level only (no
  session-level per-channel funnel) — see the "Known limitation" note
  under "Weekly executive report" above.
- Cron is not activated — see "Production activation steps."
- **Runtime/timeout**: no `maxDuration` is set on `/api/internal/seo/
  run` — today's jobs never call a real external API (all adapters are
  `NOT_CONFIGURED`), so every run completes in well under Vercel's
  default function timeout regardless of plan, and setting a duration
  now would just be a guess. Once a real GSC/PageSpeed/SERP/AI call is
  added, revisit both `maxDuration` (Vercel route config) and
  `STALE_AFTER_MINUTES` (run-job.ts, currently 30) together — the
  staleness window should stay comfortably above whatever `maxDuration`
  ends up being, so a legitimately-still-running job is never reclaimed
  out from under itself. If a function IS killed mid-run (timeout or
  otherwise) today, its row simply stays RUNNING until the next
  `acquire()` attempt for that job type reclaims it past the staleness
  window — never a permanent lock, but recovery is only as prompt as
  the next scheduled/manual attempt.
