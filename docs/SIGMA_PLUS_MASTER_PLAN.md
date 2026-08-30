# SIGMA PLUS AGENCY — Master Plan

Status: living document. Updated at the end of every phase.
Last updated: 2026-08-31 (Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, and Phase 6 complete).

---

## PHASE 0 — AUDIT

### 0.1 Repository state

`C:\Users\Privat\Downloads\sigmaplusagency` was an **empty, non-git directory** when this project started. There was no pre-existing SIGMA+ or Brahim Dev code inside it. All prior work lives elsewhere on disk and had to be located and audited separately (see below). This directory is now the root of the new SIGMA+ codebase.

### 0.2 Locating the existing Brahim Dev source

Searched `Downloads`, `Documents`, `Desktop`, and VS Code's recent-workspace history for anything matching "brahim", "portfolio", "sigma". Found multiple candidates:

| Location | What it is | Verdict |
|---|---|---|
| `Downloads/brahim dev/project` | Extracted Next.js 13.5.1 app, single `app/page.tsx` (748 lines), FR/AR toggle only | Oldest snapshot found locally |
| `Downloads/brahim dev.zip`, `brahim dev 1.zip`, `brahim dev 2.zip`, `brahim dev 3.zip` | Sequential Bolt.new exports of the same site (`.bolt/config.json` confirms Bolt origin) | Progressively iterate the FR/AR/EN toggle site; none contain the current live content (verified by extracting all 4 and grepping for live project names — zero matches) |
| `Downloads/theme brahim dev/*` | ~16 unrelated e-commerce/kids/decor theme templates built for other clients | Not SIGMA+ source, ignore |
| `Downloads/portfolio_website/index.html` | A 543-byte static HTML stub | Not the real site, ignore |
| `Downloads/portfolio_images/` | 4 PNGs: `dzenix.png`, `eleman_shoes.png`, `evizza.png`, `saheat.png` | **Real project thumbnails** — match the live site's project names. Reusable media. |
| `https://brahim-dev.vercel.app/fr` (live, fetched directly) | The actual current production site | **This is the authoritative content source**, and it is newer than every local zip |

**Key finding:** none of the four local Bolt.new zip exports match what is actually deployed. The live site was updated through a channel that left no local backup (direct edit, a newer Bolt/v0 session not saved locally, or a different machine). This means **the local source code cannot be reused as code** — only the deployed page content (fetched live) and the standalone image assets are usable as source material. Architecturally, the site is being rebuilt from scratch anyway (Next.js 13 → 16, no i18n routing → real localized routes, no design system → SIGMA+ tokens), so this is not a blocker.

### 0.3 Technical audit of the local Next.js snapshots (representative of all 4)

Ran on `Downloads/brahim dev/project` (build tools already installed there):

- **Framework:** Next.js 13.5.1, App Router, `output: 'export'` (static export, no server features)
- **Language:** TypeScript 5.2.2, strict mode on
- **Styling:** Tailwind 3.3.3 + shadcn/ui (`components/ui/*`, full set installed but barely used — only `Button` and `Card` are imported in the page)
- **State/i18n:** a single `useState<'fr'|'ar'>` toggle in the page component — **no localized routes, no URL-based language, no SEO-visible language switch, no `hreflang`, no RTL beyond a `dir` attribute flip**
- **Data layer:** `@supabase/supabase-js` is a listed dependency but **never imported or used anywhere in the code** — dead dependency
- **API routes / auth / CRM / AI:** none exist
- **Testing:** none (no test runner configured)
- **`npm run typecheck` (tsc --noEmit):** ✅ passes, zero errors
- **`next build`:** ✅ builds and statically exports successfully
- **Git:** no `.git` directory — the project was never version-controlled
- **Secrets:** `.env` file present but **empty (0 bytes)** — nothing sensitive was found or exposed

### 0.4 Live site audit (brahim-dev.vercel.app/fr, fetched 2026-08-30)

Content actually in production today:

- **Nav:** FR / AR / EN / DE language switcher, Services / Thèmes / Projets / Contact
- **Hero:** "Créateur de produits full-stack" / "Je conçois des produits digitaux prêts à être lancés" / "SaaS · Marketplaces · Apps mobiles · Outils métier"
- **Stats banner:** 50+ projects, 98% satisfaction, 24/7 support, 4 languages — **unverified marketing copy, not backed by any data source found on disk. Treated as NOT reusable as fact.**
- **Portfolio (4 projects, real):**
  - **SahEat** — food delivery marketplace, mobile apps + admin dashboard, on Google Play
  - **e-Vizza** — AI-powered SaaS visa automation platform
  - **Eleman Shoes** — e-commerce with inventory management
  - **Dzenix** — digital agency website + branding
  - Matching thumbnails exist locally in `portfolio_images/` (see 0.2). No case-study detail (challenge/strategy/outcome), no live/repo URLs, no dates were recovered — **NEEDS USER DATA** for anything beyond name + one-line description + thumbnail.
- **Theme library:** generic stock-photo (Pexels) template categories sold separately from the agency's own case studies — not agency portfolio, don't conflate the two in the new IA.
- **Testimonials:** 3 quotes attributed to "Ahmed B. (SahEat founder)", "Meriem K. (e-Vizza CEO)", "Carlos L. (Eleman Shoes)" — **no consent record, no verification these are real** (the earliest local snapshot has near-identical testimonial *structure* with entirely different placeholder names "Sarah L./Ahmed K./Marie D.", which strongly suggests this block is templated/generated copy, not captured client feedback). **Do not carry these into SIGMA+ verbatim. Flagged NEEDS USER DATA / VERIFY before any testimonial appears on the new site.**
- **Contact:** phone `+213 550 47 52 48` (Algeria), WhatsApp `+43 660 231 3221` (Austria), email `brahimcontact64@gmail.com`. These are real and safe to reuse for the new site's contact/WhatsApp entry points, pending owner confirmation of which number is the primary SIGMA+ business line going forward.
- **SEO:** default/boilerplate metadata only, no sitemap, no robots.txt, no structured data, no canonical/hreflang — confirmed absent on both the live fetch and every local snapshot.

### 0.5 Other source material found (not code)

- `Brahim_Beldjilali_CV.pdf` / `Brahim-Beldjilal-lebenslauf*.pdf/docx`: a **German-language accounting/marketing CV** (Master's in Buchhaltung und Finanzwesen, sales/marketing roles in Vienna and Algiers), not a software-development CV. It also contains a home address and birthdate. **Do not publish this document or its personal details on SIGMA+.** It does not support a founder/engineering bio and should not be used as source material for an About page — real founder bio content for SIGMA+ is **NEEDS USER DATA**.
- Assorted logo files (`brahim logo new.png`, `brahimdev.png`, `brahimok.jpeg`) exist but are Brahim Dev-branded, not SIGMA+-branded — not reusable as-is; a new SIGMA+ mark is required (Phase 1 branding).

### 0.6 Migration inventory (KEEP / REWRITE / EXPAND / REMOVE / NEEDS USER DATA)

| Item | Decision |
|---|---|
| Contact channels (phone, WhatsApp, email) | **KEEP** — reuse as-is, pending owner confirmation of primary number |
| Project names + thumbnails (SahEat, e-Vizza, Eleman Shoes, Dzenix) | **EXPAND** — real, keep as the seed portfolio; case-study bodies need real input |
| Case-study details (challenge/strategy/outcome/URLs/dates) | **NEEDS USER DATA** |
| Service list (web, mobile, e-commerce, SaaS/business systems) | **EXPAND** — real and consistent with the brief's service catalogue, expand into full service pages |
| Stats banner (50+, 98%, 24/7, 4 languages) | **REMOVE** as fact until verified; may keep "4 languages" since it's structurally true of the new site itself |
| Testimonials | **REMOVE** until real, attributable, consented testimonials are supplied — **NEEDS USER DATA** |
| Theme marketplace (Pexels template categories) | **REMOVE** from the agency site's primary IA — out of scope for an agency platform; revisit later as a separate product if the business wants to keep selling templates |
| Old Brahim Dev visual design (orange/white, single-page toggle) | **REMOVE** — full rebrand per spec (electric-blue, dark-first, localized routing) |
| Old CV / personal accounting background | **REMOVE** from public site — privacy + irrelevant to positioning |
| Old logos | **REMOVE** — new SIGMA+ mark required |
| Next.js 13 codebase itself | **REMOVE** — rebuilt on Next.js 16 / App Router / TypeScript from scratch, since the live site's actual source was never found locally and the local snapshots are both outdated and architecturally incompatible with the new requirements (real i18n routing, SSR/ISR, CRM, AI, SEO engine) |

### 0.7 Security / SEO / performance / accessibility findings carried into the new build

- **Security:** no secrets were found exposed anywhere in the audited material (the one `.env` file present was empty). No auth, no DB, no attack surface existed yet — nothing to remediate, but nothing to inherit either.
- **SEO:** effectively zero technical SEO exists today (default Next.js metadata, no sitemap/robots/structured data/hreflang). This is a from-scratch build, not a fix-up — matches the brief's emphasis on SEO as a first-class system.
- **Performance:** old site is a fully client-rendered single page (`'use client'` at the top of `page.tsx`), all images hotlinked from Pexels, `images: { unoptimized: true }`. New build should use RSC by default, self-hosted/optimized media, and real `next/image`.
- **Accessibility:** no landmarks beyond basic `nav`/`footer`, no visible focus states audited, RTL support was cosmetic (`dir` flip only, no logical-property CSS). New build must treat Arabic RTL as a first-class layout mode, not a mirror hack.

### 0.8 Recommended architecture (adopted for Phase 1 onward)

- **Framework:** Next.js 16 (App Router, Turbopack, RSC-first), TypeScript, `src/` layout
- **Styling:** Tailwind CSS v4 + CSS custom-property design tokens (electric-blue dark-first palette, see `docs/DESIGN_TOKENS.md` once written in Phase 1)
- **i18n:** `next-intl`, routes as `/ar /fr /en /de`, `fr` as default/root-redirect target for the Algeria-first launch, full RTL for `ar`
- **Validation:** Zod at every boundary (forms, server actions, future API routes)
- **Forms:** React Hook Form + Zod resolver
- **Data (future phases):** PostgreSQL via Supabase, introduced only when the CRM/lead-capture phase actually needs persistence — not stubbed in prematurely
- **Architecture layering:** `src/domain` (types/business rules), `src/lib` (data access, integrations), `src/components` (UI), kept strictly separated so business logic never lives inside React components, per the standing project rule
- **Deployment:** Vercel-compatible but not Vercel-locked (no Vercel-only APIs used in the core app)

### 0.9 Scope decision for this session

Phases 0–11 as specified are a multi-month build (agency site + CRM + AI consultant + SEO intelligence engine + admin panel + client portal foundations). Building all of it blind in one uninterrupted pass would violate the project's own "no half-finished implementations" and "verify before claiming done" rules. This session executes **Phase 0 (done, this document) and Phase 1 (architecture + design tokens + i18n + branding foundation)**, then stops to report actual, verified results before continuing — matching the brief's own "report at the end of every phase" requirement. Later phases (Project Builder, CRM, AI consultant, SEO engine, admin) are scaffold-ready but intentionally not started until their own phase, so nothing half-built ships as if finished.

---

## PHASE 1 — ARCHITECTURE, DESIGN TOKENS, BRANDING FOUNDATION, LOCALIZATION

### Implemented

- Scaffolded a fresh codebase with `create-next-app`: **Next.js 16.3.3** (App Router, Turbopack, React 19, TypeScript strict, `src/` layout, Tailwind CSS v4).
- **i18n routing** with `next-intl` v4: `src/i18n/routing.ts`, `navigation.ts`, `request.ts`, `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; migrated correctly, confirmed the deprecation warning disappears after rebuild). Locales `fr / ar / en / de`, `fr` as default, `localePrefix: 'always'` so every route is explicit (`/fr`, `/ar`, `/en`, `/de`) and `/` 307-redirects to `/fr`. Verified live: all four locales return 200, `<html lang>` and `dir` are correct per locale (`dir="rtl"` on `/ar`, `dir="ltr"` elsewhere).
- **Design tokens** in `src/app/globals.css` via Tailwind v4 `@theme`: dark-first electric-blue palette (`--color-void`, `--color-surface`, `--color-graphite`, `--color-border`, `--color-primary` #2E5EFF, `--color-primary-bright` #5B8CFF, `--color-ice`, `--color-cyan`, `--color-violet`), plus a global `prefers-reduced-motion` kill-switch.
- **Architecture layering**: `src/domain` reserved for future business types, `src/lib` for data access/config (`site-config.ts`, `whatsapp.ts`, `utils.ts`), `src/components` for UI, `src/i18n` for locale plumbing — no business logic inside page components.
- **Centralized WhatsApp link builder** (`src/lib/whatsapp.ts`) and **centralized site config** (`src/lib/site-config.ts`, env-driven via `.env.example`) — every CTA on the page goes through these, nothing hardcoded inline, matching the brief's requirement that the WhatsApp number be configurable in one place.
- **SEO foundation**: per-locale `generateMetadata` (title/description from messages, canonical + `hreflang` alternates, OpenGraph, Twitter card), `robots.ts`, `sitemap.ts` enumerating all locales with alternates, and a `ProfessionalService` JSON-LD block on the homepage.
- **Real homepage** (not the Phase 2 flagship 3D experience — a working, honest foundation page) with hero, services grid (6 services from the brief's catalogue), work grid (the 4 real projects recovered in the audit: SahEat, e-Vizza, Eleman Shoes, Dzenix), and a contact/WhatsApp section — fully translated (natively, not machine-translated) into all 4 languages from `messages/{fr,ar,en,de}.json`.
- Component primitives: `Button` / `ButtonLink` (`class-variance-authority`), `SiteHeader`, `LanguageSwitcher` (client component, preserves current path on locale switch), `SiteFooter`.

### Files changed

New: `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`, `src/proxy.ts`, `messages/fr.json`, `messages/ar.json`, `messages/en.json`, `messages/de.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/site-config.ts`, `src/lib/whatsapp.ts`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/language-switcher.tsx`, `.env.example`.
Removed: default `create-next-app` `src/app/page.tsx` and `src/app/layout.tsx` (superseded by the `[locale]` segment, which is the standard next-intl structure).
Modified: `next.config.ts` (next-intl plugin + `turbopack.root`), `src/app/globals.css` (design tokens).

### Tests executed / results

- `tsc --noEmit`: **pass**, 0 errors.
- `eslint .`: **pass**, 0 errors, 0 warnings.
- `next build`: **pass** — all 4 locale pages pre-render statically (SSG via `generateStaticParams`), `/robots.txt` and `/sitemap.xml` generate correctly, no warnings.
- Manual browser verification (Playwright, since no `chromium-cli` was available in this environment): ran the dev server and captured real screenshots at desktop (1440×900) and mobile (390×844) viewports.
  - `/fr` desktop: hero, services grid, work grid, and contact section all render correctly with the intended dark electric-blue theme. Zero browser console errors.
  - `/ar` desktop: full RTL mirroring confirmed correct (nav order, logo position, text alignment, card layout all flip properly).
  - **Bug found and fixed during this verification**: the phone number in the Arabic contact section rendered digit-group-reversed (`48 52 47 550 213+`) due to the browser's bidi algorithm reordering a Latin numeral string inside an RTL context. Fixed by wrapping phone/email in `<span dir="ltr">`; re-verified with a follow-up screenshot showing `+213 550 47 52 48` in correct order.
  - `/fr` mobile: single-column responsive stacking confirmed, all CTAs full-width and tappable.

### Known limitation carried forward (not fixed now, scope discipline)

- No mobile hamburger menu yet — on small viewports the header only shows the logo and language switcher; Services/Work/Contact are still reachable by scrolling (they're anchor sections on one page) but not from an explicit mobile nav. Acceptable for this single-page Phase 1 foundation; revisit once Phase 3 introduces real multi-page navigation (service pages, case-study pages).

### Remaining risks

- The homepage is intentionally minimal (no 3D flagship hero, no scroll storytelling, no case-study depth) — this is the Phase 2 scope, not skipped, just not yet built.
- Contact/testimonial/stat content flagged `NEEDS USER DATA` in the Phase 0 audit is still outstanding and will gate the Portfolio (Phase 3) and content-integrity of the homepage's future revisions.
- `TypeScript ^5` was installed by `create-next-app` rather than the newly-released `typescript@7`; kept at `^5` deliberately since the wider ecosystem (ESLint config, Next's own tooling) targets 5.x — revisit once TS7 compatibility is broadly confirmed.

### Next phase

**Phase 2 — Homepage flagship experience**: the real hero (headline system, oversized typography, the SIGMA "+" interactive visual, scroll-based motion), replacing today's functional-but-modest hero, still built progressively (works with WebGL off / reduced-motion / low-power) per the brief's 3D and motion requirements.

---

## PHASE 2 — FLAGSHIP VISUAL IDENTITY

### Implemented

**Brand system**
- `SigmaMark` (`src/components/brand/sigma-mark.tsx`): a code-drawn Σ+ glyph — a stylized sigma stroke with the "+" sitting in its open right-hand pocket — as pure SVG, no external asset, legible at 16px. Electric-blue gradient and monochrome variants.
- `Wordmark` (`src/components/brand/wordmark.tsx`): mark + "SIGMA+" lockup, used in the header and footer.
- `src/app/icon.svg`: the mark on a dark rounded tile, replacing `create-next-app`'s default `favicon.ico` (removed) as the browser-tab icon.

**Flagship 3D hero object**
- `src/components/hero/sigma-scene.tsx`: the same Σ+ silhouette as the 2D mark, built in Three.js from beveled bar primitives (`RoundedBox` + drei `Outlines` for the illuminated-edge look), not a hand-derived extruded polygon — that approach was tried first and abandoned as too fragile to get right without visual iteration; primitives assembled from simple geometry are robust and still deliver the "engineered/technical" look the brief asked for.
- Reacts to pointer movement (tilt, lerped), floats/rotates gently (drei `Float`), has a small procedural particle field (drei `Sparkles`, no texture asset).
- **Capability-gated, not just visually gated**: `src/components/hero/sigma-object.tsx` probes `prefers-reduced-motion`, WebGL support, and weak-device heuristics (`hardwareConcurrency`, `deviceMemory`, `connection.saveData`) once on mount, and only then decides between the full scene, a reduced-quality scene (capped DPR, no particles), or `SigmaFallback` — a static CSS/SVG stand-in (spinning ring disabled under reduced motion via `motion-safe:`).
- The heavy Three.js/R3F/drei chunk is loaded via `next/dynamic(..., { ssr: false })` — confirmed by inspecting the served HTML that its chunk is **not** referenced in the initial page load (see Performance below).

**Motion system**
- `src/lib/motion.ts`: one set of durations/eases and reusable variants (`fadeUp`, `fadeIn`, `scaleIn`, `staggerContainer`), used by every animated section instead of ad-hoc per-component tuning.
- `MotionConfig reducedMotion="user"` set globally in `src/app/[locale]/layout.tsx` — every `motion` animation in the app collapses to instant for anyone with `prefers-reduced-motion`, with no per-component opt-in needed.
- Scroll-progress hairline in the header (`useScroll` from `motion/react`), transparent → blurred/dark header transition, animated mobile menu (staggered link reveal, hamburger↔close morph).

**Restructured homepage — the scroll story**
Rebuilt as composed sections instead of one page file: `HeroSection`, `WhatWeBuildSection` (01), `WorkSection` (02), `WhySection` (03, new — Strategy/Design/Engineering/AI/Growth, capability-framed, no invented metrics), `CtaSection` (04). Hero copy refined to the brief's concept ("We don't just build software. We build digital advantage.") with genuinely separate, natural translations per language rather than forced identical line breaks — see the updated `messages/*.json`.

**Background system**
- `src/components/backgrounds/grid-glow.tsx`: technical grid + soft radial blue/cyan glow + a hairline SVG-noise layer, all CSS/SVG, zero image requests, `aria-hidden`.

**A real content-integrity decision worth flagging**: the brief said to use the actual available project thumbnails. I pulled the four PNGs from `Downloads/portfolio_images/` and inspected them — they turned out to be generic auto-generated title cards (flat orange/blue/purple backgrounds with the project name and a German subtitle), not real product screenshots, and one of them is literally the flat-purple-gradient look the brief explicitly says to avoid. Using them as "project imagery" would have misrepresented what they are and clashed with the new palette, so I did not use them. The work cards instead use a clean number/tag/gradient treatment built from verified text facts only (name, one-line description, category tag) — no fabricated visuals, no fabricated metrics.

### Design decisions

- Hero CTA order follows the brief exactly: primary "Start a project" (solid), secondary "WhatsApp us" (solid, brand green), tertiary "View our work" as a subtle underlined-arrow link — not a third competing button.
- Same-page section links (`#services`, `#work`, `#why`, `#contact`) are deliberately plain `<a href="#...">`, not next-intl's locale-aware `Link` — routing a bare `/#services`-style href through `Link` risks resolving to the default-locale root instead of staying on the visitor's current locale. Only the logo (a real route, `/`) uses `Link`.
- No bloom/postprocessing library was added to fake the glow — `Outlines` on the 3D bars plus the CSS `GridGlow` behind the canvas gives a convincing "illuminated edge" look without the extra dependency and GPU cost.
- Contact number handling: unchanged from Phase 1, still centralized in `site-config.ts`/`.env.example`, still flagged as needing the owner's confirmation — nothing was silently switched to the Algerian number.

### Files changed

New: `src/components/brand/sigma-mark.tsx`, `wordmark.tsx`; `src/components/hero/sigma-scene.tsx`, `sigma-fallback.tsx`, `sigma-object.tsx`, `hero-visual.tsx`; `src/components/backgrounds/grid-glow.tsx`; `src/components/sections/hero-section.tsx`, `what-we-build-section.tsx`, `work-section.tsx`, `why-section.tsx`, `cta-section.tsx`; `src/components/header-client.tsx`; `src/components/ui/section-label.tsx`; `src/lib/motion.ts`; `src/app/icon.svg`.
Modified: `src/app/[locale]/page.tsx` (rebuilt from sections), `src/app/[locale]/layout.tsx` (`MotionConfig`), `src/components/site-header.tsx` (split server/client), `src/components/site-footer.tsx` (uses `Wordmark`), `src/components/language-switcher.tsx` (focus states), `messages/*.json` (refined hero copy, new `why` section, service/work `tag` fields).
Removed: `src/app/favicon.ico` (superseded by `icon.svg`).
New dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `motion`.

### 3D implementation summary

React Three Fiber 9 + drei 10 + three 0.185, all procedural geometry (no imported models/textures). Lazy-loaded client-only. Adaptive: `dpr={[1,1.75]}` on capable devices, `[1,1]` on weak ones; particles skipped entirely on weak devices; fully replaced by a static CSS fallback under reduced motion, no WebGL, or a hard weak-device signal.

### Performance impact (measured, not estimated)

Built production bundle and inspected `.next/static/chunks` plus the actual HTML served by `next start`:
- **Initial JS for the homepage: ~243 KB gzipped** (React 19 + Next.js runtime + next-intl client + `motion` + all page/section code combined).
- **Three.js/R3F/drei chunk: ~231 KB gzipped, confirmed absent from the initial page's HTML** — it only loads client-side, after mount, after the capability check decides the visitor gets the 3D scene. Verified by grepping the server-rendered HTML for chunk references before assuming this from the dynamic-import code alone.
- No layout shift on swap-in: the fallback and the 3D canvas render inside the same fixed `aspect-square` container, so there's nothing to reflow when one replaces the other.

### Browser/device QA (real, not assumed)

Ran the actual production build (`next build` + `next start`) through Playwright: navigated, **scrolled through the full page** (not just a viewport-less full-page screenshot, which turned out to hide `whileInView` content because Chromium's beyond-viewport capture never moves the real viewport that `IntersectionObserver` watches — caught this during QA and fixed the test method itself), then checked for layout overflow, console errors, and page errors, and screenshotted:

| Check | Viewport | Locale | dir | Overflow | Console errors | Page errors |
|---|---|---|---|---|---|---|
| Desktop | 1440×900 | fr | ltr | none | 0 | 0 |
| Desktop | 1440×900 | ar | rtl | none | 0 | 0 |
| Large desktop | 1920×1080 | fr | ltr | none | 0 | 0 |
| iPhone-like | 390×844 | fr | ltr | none | 0 | 0 |
| iPhone-like | 390×844 | ar | rtl | none | 0 | 0 |
| Small mobile | 360×800 | fr | ltr | none | 0 | 0 |
| Tablet | 768×1024 | fr | ltr | none (fixed — was overflowing) | 0 | 0 |
| Desktop | 1440×900 | en | ltr | none | 0 | 0 |
| Desktop | 1440×900 | de | ltr | none | 0 | 0 |
| Desktop, reduced motion | 1440×900 | fr | ltr | none | 0 | 0 |

**Two real bugs found and fixed during this pass, not before it:**
1. **Header overflow at exactly 768px** (3px horizontal overflow): the desktop nav (logo + 4 links + language switcher + CTA button) was set to appear at Tailwind's `md:` breakpoint (768px), which is too narrow to fit all of it. Fixed by moving the full desktop header to `lg:` (1024px); 768–1023px now correctly gets the (already good-looking) mobile menu instead of a cramped desktop one.
2. **Orphaned grid cell in the "Why SIGMA+" section**: 5 capability cards in a 2-column tablet layout left an empty 6th cell. Fixed by spanning the last item across both columns when the count is odd.

Also re-confirmed from Phase 1 still holds: Arabic RTL mirrors correctly (nav order, logo side, text alignment), the phone-number bidi fix still displays `+213 550 47 52 48` in the correct order inside the new `CtaSection`, and the reduced-motion fallback genuinely renders a static (non-spinning) mark rather than silently doing nothing.

### Accessibility QA (real, not assumed)

Ran an actual keyboard `Tab` sequence against the production build and read each focused element's computed outline/box-shadow (not just eyeballing a screenshot). Tab order is logical: logo → nav links → language switcher → "Start a project" CTA. The CTA already had a custom electric-blue focus ring (from Phase 1's `buttonVariants`); the nav links, language switcher, and mobile-menu links were relying on the browser's bare default outline, so a matching branded `focus-visible` ring was added to all of them for consistency. Decorative elements (`GridGlow`, the ghost project numbers, the 3D canvas) are `aria-hidden` / non-interactive and add no accessibility noise. Reduced motion, RTL, and bidi are covered above.

### Tests executed / results

- `tsc --noEmit`: pass, 0 errors.
- `eslint .`: pass, 0 errors, 0 warnings (one real one was caught and fixed along the way — `react-hooks/set-state-in-effect` on the 3D capability probe, resolved with a narrowly-scoped, commented exception since it's a genuine one-time client-only mount read, not a render-cascade anti-pattern).
- `next build`: pass, all 4 locales statically generated, `/icon.svg`, `/robots.txt`, `/sitemap.xml` all present.
- Post-build smoke test (`next start` + curl): all 4 locale routes return 200.
- Full Playwright QA pass (table above): 0 console errors, 0 page errors, 0 layout overflow across every check, both bugs found during QA fixed and re-verified.

### Remaining risks / known limitations (carried forward deliberately)

- Work cards have no "View project" link yet — case-study pages don't exist until Phase 3, and adding a link to nowhere would violate the no-dead-buttons rule. The cards are an honest teaser, not a shortcut.
- Nav's "About" points to the new `#why` (approach) section as a reasonable stand-in; "Insights" (blog) has nothing to link to yet and was left out of the nav entirely rather than added as a dead link — it returns in Phase 9.
- The 3D object is a first, fully-working art direction, not a final polish pass — if the owner wants a more elaborate object later, the geometry is isolated in one file (`sigma-scene.tsx`) and can be iterated on without touching the loader/fallback/capability-gating logic.
- Old CV, old logos, unverified testimonials/stats: still excluded, per Phase 0.

### Next phase

**Phase 3 — Services, portfolio, and case studies**: dedicated service pages (the six teased on the homepage), and real case-study pages for SahEat / e-Vizza / Eleman Shoes / Dzenix so the "Work" cards finally have somewhere to link — gated on the owner supplying real challenge/strategy/outcome content per project (tracked as `NEEDS USER DATA` since Phase 0).

---

## PHASE 3 — SERVICES, CASE STUDIES, AND REAL CONTENT ARCHITECTURE

### Implemented

**Typed content layer, not JSX-embedded copy.** `src/domain/service.ts` and `src/domain/case-study.ts` define the data models (`ServiceContent`, `ServiceMeta`, `CaseStudyContent`, `CaseStudyMeta`, `ContentStatus`). `src/content/services/{fr,en,ar,de}.ts` and `src/content/case-studies/{fr,en,ar,de}.ts` hold the per-locale prose; `meta.ts` in each holds locale-independent facts (technologies, cross-links, verified project facts). This is designed so a future database/CMS migration (explicitly foreshadowed for later phases) replaces the content files without touching the page components — pages only ever call `getServiceContent()` / `getCaseStudyContent()` and friends.

**All 12 planned services now have full pages**: Web Development, Mobile Applications, E-commerce, SaaS & Platforms, AI Agents, Voice AI, Automation, UI/UX Design, SEO & Growth, Backend & API, Cloud & Infrastructure, Maintenance & Support. Each has a unique, specific (not templated-filler) positioning, description, problems/deliverables/capabilities lists, a real technology list, relevant industries, and 2–3 FAQ entries — written natively in all four languages, not machine-translated. Services are grouped into four categories (Build / Intelligence / Experience / Infrastructure) on a new editorial `/services` index instead of a flat 12-card grid.

**Localized slugs, stable internal IDs.** Every service and project has one stable `ServiceId`/`ProjectId` used internally, and a per-locale `slug` used in URLs — e.g. `web-development` → `/fr/services/developpement-web`, `/en/services/web-development`, `/de/services/webentwicklung`, `/ar/services/تطوير-الويب`. The `/services` and `/work` segment names themselves stay literal across locales (matching the brief's own examples); only the leaf slug localizes.

**Four real case-study pages** (SahEat, e-Vizza, Eleman Shoes, Dzenix), each showing only what Phase 0's audit actually verified: what the product is, its core functionality, industry, platforms, and which SIGMA+ services it involved. Challenge/strategy/implementation/outcome sections are coded to render conditionally and are simply **absent** right now — not filled with "coming soon" — because none of that narrative was ever verified. `docs/CASE_STUDY_OWNER_INPUT.md` documents exactly what's needed per project to unlock those sections later, with zero blocking on this phase.

**No fake screenshots.** Every case study uses a small `ProjectVisual` component: a decorative browser-chrome frame showing the project's name in its own accent color — explicitly not presented as a real screenshot, since none exist (the old site's thumbnails were already rejected in Phase 2 for the same reason).

**About and Contact pages.** About states SIGMA+'s honest positioning (a digital product studio, not "X years in business" or invented team size) plus a real seven-stage process (Discover → Define → Design → Build → Test → Launch → Improve). Contact has a full Zod + React Hook Form form (name, company, email, phone, project type, budget, timeline, message) with a real server-action boundary (`src/lib/actions/contact.ts`) — see "Content integrity" below for exactly what it does and doesn't claim.

**Contextual WhatsApp messages, centralized.** `whatsappTemplates.service` / `.project` in each locale's messages file are interpolated with the specific service or project name (e.g. "I saw your SahEat project and would like to discuss something similar") and built through the existing single `buildWhatsAppUrl()` helper — no per-component hardcoded message strings.

**SEO**: every service and case-study page has unique title/description/canonical/hreflang via `generateMetadata`, `Service` and `CreativeWork` JSON-LD respectively, `BreadcrumbList` JSON-LD on every inner page (via the new `Breadcrumbs` component), and `FAQPage` JSON-LD on service pages with FAQs. `sitemap.ts` now enumerates all 89 real routes (home, services index, 48 service-detail pages, work index, 16 case-study pages, about, contact) across all 4 locales with correct per-locale `alternates.languages`.

**Internal linking**: homepage service/work cards now link to their real detail pages (previously decorative only); service pages link to related services and related projects (matched by shared `ServiceId` tags — no manual curation drift); case-study pages link to their related services and to the next project in sequence; every inner page has breadcrumbs back to Home and its index.

**Two real bugs found during this phase's QA and fixed, not shipped:**

1. **Arabic-slug pages were serving HTTP 404 despite rendering correct content.** Root cause, confirmed by tracing the exact `params.slug` value Next.js/Turbopack 16.3.3 passes during the `generateStaticParams`-driven prerender pass: for non-ASCII dynamic segments, the value arrives **still percent-encoded** (`%D8%AA%D8%B7...`) instead of decoded, even though the output HTML filename on disk is correctly decoded. This is a framework-level inconsistency, not a mistake in this codebase's own logic (verified by comparing raw Unicode codepoints between the source content and the decoded URL — they were byte-identical). Fixed defensively in `src/lib/slug.ts`'s `matchesSlug()`, used by both `getServiceBySlug` and `getProjectBySlug`: try an exact match first, fall back to matching against `decodeURIComponent(requested)`. Confirmed fixed: all Arabic service/project URLs now return 200 with correct per-locale hreflang alternates.
2. **next-intl's automatic `Link` response header was emitting wrong hreflang alternates** — it naively swaps the locale segment on the current pathname, which breaks the moment locales have different slugs for the same content (exactly our case). Disabled via `alternateLinks: false` in `src/i18n/routing.ts`, since the correct per-locale alternates are already emitted via `generateMetadata`'s `alternates.languages` → real `<link rel="alternate">` tags in the HTML head.

### Content integrity — what's verified vs. not

Per the audit's `KEEP / EXPAND / NEEDS_OWNER_INPUT` framework: service copy describes SIGMA+'s general capabilities (real, generalizable claims about what the studio can build) — this is expand-safe. Case-study copy is strictly limited to facts recoverable from Phase 0's audit (product type, category, core functionality, which services applied). No client results, no metrics, no "years of experience," no team size, no invented client quotes, no fake screenshots appear anywhere in Phase 3. The Contact form's server action does **not** claim the message was received into a working CRM pipeline — its success state explicitly says no automated system exists yet and offers WhatsApp as the real, functional continuation path (server-side, it currently only logs the lead — a clearly marked placeholder for Phase 5's actual persistence).

### SEO implementation

Per-page unique metadata (no duplicated templates), canonical URLs, correct per-locale hreflang (verified for both Latin and Arabic slugs after the bug fix above), `BreadcrumbList` + `Service`/`CreativeWork`/`FAQPage` structured data, and a sitemap covering all 89 real routes. No keyword stuffing, no doorway pages, no fabricated local-SEO city pages — the Algeria-relevant framing (WhatsApp-first flows, Arabic/French bilingual businesses, mobile-first audiences) is woven into service copy naturally rather than mechanically repeating "Algérie."

### Files changed

New: `src/domain/service.ts`, `src/domain/case-study.ts`, `src/domain/contact.ts`; `src/content/services/{fr,en,ar,de,meta,index}.ts`; `src/content/case-studies/{fr,en,ar,de,meta,index}.ts`; `src/lib/slug.ts`, `src/lib/actions/contact.ts`; `src/components/ui/{breadcrumbs,page-hero,faq-accordion}.tsx`; `src/components/case-study/project-visual.tsx`; `src/components/contact/contact-form.tsx`; `src/app/[locale]/services/page.tsx` + `[slug]/page.tsx`; `src/app/[locale]/work/page.tsx` + `[slug]/page.tsx`; `src/app/[locale]/about/page.tsx`; `src/app/[locale]/contact/page.tsx`; `src/app/[locale]/not-found.tsx`; `docs/CASE_STUDY_OWNER_INPUT.md`.
Modified: `src/i18n/routing.ts` (`alternateLinks: false`), `src/app/sitemap.ts` (all new routes), `src/components/header-client.tsx` (nav now points to real pages instead of homepage anchors — a necessary consequence of dedicated pages existing now), `src/components/sections/{what-we-build,work}-section.tsx` (now link to real pages, sourced from the content layer instead of duplicated homepage-only copy), `src/app/[locale]/page.tsx` (homepage sourced from content layer), all four `messages/*.json` (new `servicesPage`, `serviceDetail`, `workPage`, `caseStudy`, `about`, `contactPage`, `notFound`, `whatsappTemplates`, `breadcrumbs` namespaces).

### Tests executed / results

- `tsc --noEmit`: pass, 0 errors.
- `eslint .`: pass, 0 errors, 0 warnings.
- `next build`: pass — **89 static pages** generated across all 4 locales (home, services × 12, work × 4, about, contact, plus indexes).
- Route smoke test (all locales, valid and invalid slugs): every real route 200s, every invalid slug/locale correctly 404s via `not-found.tsx` (confirmed it resolves the correct locale with no props, using `next-intl`'s request-scoped `getLocale()`/`getTranslations()` — verified against the Next.js 16 docs directly rather than assumed from older training data).
- Contact form: tested end-to-end with Playwright — empty submit shows 4 client-side validation errors; valid submit calls the real server action (confirmed via the server's own log line), returns the honest success state, and produces a correctly pre-filled WhatsApp continuation link. Zero console errors.
- Click-through test: services index → service detail → related project → case study all resolved to the correct real pages with zero console/page errors.
- Performance: initial JS for a service-detail page measured at ~244KB gzipped — statistically the same as Phase 2's homepage figure (243KB), confirming the new content layer and pages added no meaningful client-side bundle weight (the content is server-rendered data, not shipped as JS).

### Browser QA (real, screenshotted)

12 checks across desktop (1440×900) and mobile (390×844) viewports, `fr`/`ar`/`de` locales, covering services index, service detail, work index, case-study detail, about, and contact: **zero layout overflow, zero console errors, zero page errors** in the final pass. Arabic RTL confirmed correct on service-detail pages specifically (sidebar mirrors to the left, breadcrumb chevrons flip, FAQ accordion chevrons on the correct side) — this was checked freshly for Phase 3's new page types, not assumed to carry over from Phase 2's homepage-only RTL check.

### Remaining risks / known limitations (carried forward deliberately)

- Case-study narrative sections (challenge/strategy/outcome) are absent pending real owner input — tracked, not blocking, not faked.
- The homepage's original `services.items` teaser array still exists unused in `messages/*.json` (superseded by sourcing the same 6 services from the content layer) — harmless dead data, flagged here rather than silently left for someone to wonder about later.
- Nav's "Insights" (blog) still has no destination and stays out of the nav until Phase 9 builds it.
- Contact form has no spam/rate-limiting protection yet — acceptable for now since it has no real backend to abuse (Phase 5/10 territory once persistence exists).
- The Next.js/Turbopack non-ASCII static-param bug documented above is now worked around in this codebase, but is worth a heads-up if the framework is ever upgraded and the workaround's continued necessity should be re-checked.

### Next phase

**Phase 4 — Project Builder, lead capture, and WhatsApp integration**: the multi-step interactive Project Builder (what to build → goal → capabilities → platforms → timeline → budget → AI-generated brief → proposal/WhatsApp handoff), and turning the Contact form's current honest-placeholder persistence into real lead storage.

---

## PROJECT POLICY — AUTOMATED BROWSER E2E TESTING IS DISABLED

**Owner policy, set during Phase 4 (2026-08-30), durable for all future phases:** automated browser E2E testing (Playwright or any equivalent — Cypress, WebdriverIO, etc.) is **disabled for this project** because it proved unreliable and blocking in this development environment (a formal `@playwright/test` suite hung/ran long enough during Phase 4 that the owner had it removed mid-phase). Phase acceptance criteria from this point on use: TypeScript, ESLint, the Vitest integration/unit suite, a production build, database/migration verification, and short, targeted, non-blocking manual smoke checks — not automated browser E2E.

**For future phases/agents: do not reintroduce Playwright, Cypress, or any browser-automation test framework as a project dependency or acceptance requirement unless the owner explicitly asks for it again.** Any phase-completion checklist that lists "E2E tests pass" inherited from the original project brief should be read as satisfied by the manual-smoke-check alternative described above, not as requiring browser automation.

---

## PHASE 4 — PROJECT BUILDER + LEAD CAPTURE + WHATSAPP FUNNEL + CRM FOUNDATION

### Implemented

**Real database architecture**, not a mock. `src/lib/db/schema.ts` defines three Drizzle Postgres tables — `leads`, `project_requests`, `lead_activities` — with proper foreign keys (`ON DELETE CASCADE`), a unique constraint on `leads.public_reference`, and indexes on `email_normalized`, `phone_normalized`, and both activity/request tables' `lead_id` (added mid-phase after noticing Postgres doesn't auto-index foreign key columns — see "Migration" below). Two generated SQL migrations exist (`0000_dusty_ink.sql`, `0001_famous_mephisto.sql`), both purely additive, no destructive statements.

**Development vs. production persistence, explicit not silent** (`src/lib/db/client.ts`):
- **Production** (`NODE_ENV=production`, no `DATABASE_URL`): throws immediately at startup with a clear message. There is no code path where production silently accepts leads into memory.
- **Production with `DATABASE_URL` set**: real PostgreSQL via `postgres-js` (works with Supabase or any standard Postgres host).
- **Development/test** (no `DATABASE_URL`): PGlite — a real embedded WASM build of PostgreSQL, not an in-memory fake. It runs actual SQL, actual constraints, actual migrations, file-persisted under `.data/` (gitignored) by default, overridable via `PGLITE_DATA_DIR`.
- **Tests**: `createTestDb()` gives each test file its own in-memory PGlite instance (`memory://`), never touching the dev data directory.

**A genuine framework bug was found and fixed mid-phase**: `@electric-sql/pglite` broke under Turbopack's server bundling with a `TypeError: The "path" argument must be of type string or an instance of Buffer or URL` — PGlite manages its own WASM/filesystem paths internally, and Turbopack's rewriting of `import.meta.url`/Node built-in boundaries broke that. Fixed by adding it to `serverExternalPackages` in `next.config.ts` (the same category of fix Next.js documents for `sharp`, `better-sqlite3`, etc. — `@electric-sql/pglite` just isn't on their default list yet). Confirmed fixed by tracing the actual dev-server error log, not guessing.

**Lead schema**: id, public reference, name/email/phone (raw + normalized for dedup), company, country, language, preferred contact method, source (`contact_form` | `project_builder`), status (defaults to `NEW`, full 12-state lifecycle from the master plan modeled in `src/domain/lead.ts` but not yet exposed anywhere — that's Phase 5's CRM), full UTM/landing-page/referrer attribution, timestamps.

**ProjectRequest schema**: linked to a lead, project type/goals/capabilities/platforms (stored as JSONB arrays of canonical IDs — never translated labels), business state, optional current-website, timeline, budget range, optional free-text message, the full structured brief (JSONB), locale, timestamp.

**LeadActivity schema**: linked to a lead, a typed `type` (`lead_created` | `contact_form_submitted` | `project_request_submitted` | `whatsapp_handoff_clicked`), optional JSONB metadata, timestamp.

**Deduplication rule, deterministic and documented in code** (`src/lib/services/identity.ts`, `lead-service.ts`): a submission matches an existing lead only on normalized email (always) or normalized phone (only when both sides have one) — never fuzzy name matching. A match reuses the existing lead and records a new activity + project request against it; no match creates a new lead. Verified with a real test: submitting the same email with different casing (`repeat@example.com` vs `REPEAT@example.com`) correctly resolves to one lead with two project requests, not two leads — confirmed both via a Vitest test and by accident during manual testing (I ran the same browser submission twice while debugging the Turbopack/PGlite issue and the resulting database genuinely showed one lead with two `project_request_submitted` activities).

**Public reference design** (`src/lib/services/reference.ts`): `SP-XXXXXX`, 6 characters from a 31-character alphabet that excludes visually ambiguous characters (0/O, 1/I/L) since people read these back over the phone or WhatsApp — not derived from the database ID, not sequential. The database enforces uniqueness via a `UNIQUE` constraint (collision probability across the realistic lead volume for this business is astronomically low; a retry-on-collision loop was considered but not added given the current the scale — noted as a known, cheap future improvement rather than a real gap).

**Project Builder**: `/[locale]/start-project`, 9 data steps (what to build → goals → capabilities → platforms → business state [with a conditional current-website field] → timeline → budget → contact → message) plus a summary screen with per-section edit links and a success/failure result screen. Built as one state-machine client component (`src/components/project-builder/project-builder.tsx`) reading all copy via `useTranslations`/`useLocale` directly from the already-app-wide `NextIntlClientProvider` (no giant prop-drilled labels object). All option IDs are stable canonical strings (`src/domain/project-request.ts`) — translated labels are resolved for display only, never stored. Draft recovery persists the non-PII subset (project type/goals/capabilities/platforms/business state/timeline/budget/step index) to `localStorage`, versioned, expires after 7 days, explicitly excludes name/email/phone/message, and is cleared on successful submission. Verified restoring mid-flow after a real page reload.

**Contact form migrated to the same lead pipeline** — `submitContactForm` now calls `submitContact()` in `lead-service.ts`, the identical function `submitProjectBuilder` calls (`submitProjectRequest`) shares its `findOrCreateLead` core with. There are not two lead systems.

**WhatsApp flow**: after a successful submission (Project Builder or Contact), a concise, localized WhatsApp message is built (`src/lib/services/whatsapp-summary.ts`) containing project type, primary goal, up to 3 capabilities, timeline, and the public reference — never the raw free-text message, email, or phone. **WhatsApp link construction is wrapped in its own try/catch, isolated from the persistence result**: if building the rich message fails for any reason after a lead was already saved, the code falls back to the plain WhatsApp link rather than turning a real success into an apparent crash (this exact gap was found during this phase's own review and fixed, not left as a theoretical risk).

**Attribution**: landing page, referrer, and all 5 UTM parameters are captured client-side once at submission time (`src/lib/attribution.ts`) and persisted with the lead. Verified in the repository-level smoke test that `landingPage` correctly reached the database.

**Analytics abstraction** (`src/lib/integrations/analytics.ts`): a `track(event, props)` function with a console adapter (honest placeholder — no provider is configured yet) behind a swappable interface. All 9 events from the master plan are wired: `project_builder_viewed/started/step_completed/abandoned/completed`, `lead_created`, `whatsapp_handoff_clicked`, `contact_form_submitted/failed`. Audited every call site during this phase's review: none pass email, phone, name, or message text — only step IDs, error-reason codes, and a fixed source string. Found and fixed one real gap during that audit: `whatsapp_handoff_clicked` was defined but never actually fired from any button — now wired to all 4 WhatsApp CTAs across the Project Builder result screen and Contact form.

**Security**: server-side Zod validation on both forms (`.strict()` — rejects unexpected fields), a honeypot field (`src/lib/security/honeypot.ts`, CSS-hidden not `type="hidden"`), a simple in-memory rate limiter (5 submissions / 10 minutes / IP, `src/lib/security/rate-limit.ts` — documented as needing Redis before horizontal scaling), and safe logging: Postgres constraint-violation errors embed the actual offending value in their message text (e.g. a duplicate-email error literally contains the email), so `toFailure()` in `lead-service.ts` logs only `{name, code}` in production and the full error only in development.

### Integration tests

21 Vitest tests across two files (`tests/integration/lead-service.test.ts`, `validation.test.ts`), all passing: new lead creation, activity recording, deduplication (including case-insensitive email matching), project-request creation with structured-brief generation, open-question flagging logic, public-reference format/collision-safety (50 generations, zero collisions, zero ambiguous characters), identity normalization, repository-failure handling (a broken repository correctly returns `db_unavailable` instead of throwing), and Zod schema validation (valid/invalid email, short message, bad locale, unexpected fields, invalid enum values, empty required arrays, invalid budget range, malformed vs. bare-domain URLs, oversized payloads). `next-intl/server`'s `getTranslations` is mocked in the lead-service test file — it resolves to a "react-server"-conditioned build that transitively requires `next/headers`, a module Next.js's own bundler resolves specially and that no generic test runner (Vitest, tsx) replicates outside of it; mocking the one function `structured-brief.ts` calls is the standard, pragmatic way to test this logic in isolation. The real translation behavior was separately verified through the actual Next.js dev server (see Manual verification below).

### Manual verification (no browser automation)

Per the revised policy above, final verification was: `tsc --noEmit` (clean), `eslint .` (clean, 0 warnings), `vitest run` (21/21 passing, and the ESM/CommonJS config warning fixed by renaming `vitest.config.ts` → `.mts`, plus a follow-up `__dirname` → `import.meta.dirname` fix — both genuine, low-risk config improvements, not module-system-wide changes), `next build` (clean, 93 static pages including `/start-project` in all 4 locales), and a short targeted repository-level smoke script: created a lead + project request + activity through the real repository against a fresh PGlite instance, confirmed deduplication finds the same lead on a repeat lookup, confirmed all three rows are actually readable back from the database, then deleted the smoke-test rows and confirmed zero leads remained. Script deleted after use, no test data retained.

Earlier in this phase (before the E2E policy changed), a real Playwright-driven browser session was also used ad hoc to debug the PGlite/Turbopack bug — that session independently confirmed the full stack (UI → validation → server action → real PostgreSQL-compatible write → French-labeled structured brief → generated `SP-CARV8W` reference → WhatsApp link) works end-to-end through the actual browser and dev server, including the Arabic-RTL entry point. That evidence stands; it just isn't re-run automatically going forward.

### Removed per the new policy

`tests/e2e/` (2 spec files), `playwright.config.ts`, the `@playwright/test` devDependency (uninstalled, removed from `package.json` and `package-lock.json`), the `test:e2e` npm script, the `playwright`/`test-results` `.gitignore` entries, and all `test-results`/`playwright-report` generated artifacts. All Playwright/Chromium processes left running from the aborted E2E run were confirmed killed (checked via `Get-Process`, not assumed) before continuing.

### Files changed (Phase 4)

New: `src/domain/lead.ts`, `project-request.ts`, `project-builder.ts` (Zod schema), `contact.ts` (extended); `src/config/budget-ranges.ts`; `src/lib/db/schema.ts`, `client.ts`, `migrations/0000_dusty_ink.sql`, `0001_famous_mephisto.sql`; `src/lib/repositories/lead-repository.ts`; `src/lib/services/lead-service.ts`, `reference.ts`, `identity.ts`, `structured-brief.ts`, `whatsapp-summary.ts`; `src/lib/security/rate-limit.ts`, `honeypot.ts`, `client-ip.ts`; `src/lib/integrations/analytics.ts`; `src/lib/attribution.ts`, `project-builder-draft.ts`, `slug.ts` (existing, unrelated); `src/lib/actions/project-builder.ts`; `src/app/[locale]/start-project/page.tsx`; `src/components/project-builder/*` (11 files); `drizzle.config.ts`; `vitest.config.mts`; `tests/integration/lead-service.test.ts`, `validation.test.ts`.
Modified: `src/lib/actions/contact.ts` (migrated to lead-service, WhatsApp failure isolation), `src/components/contact/contact-form.tsx` (attribution, honeypot, richer error states, analytics), `src/app/[locale]/contact/page.tsx`, `src/components/header-client.tsx` + `sections/hero-section.tsx` + `sections/cta-section.tsx` (Start-a-Project CTAs now point to `/start-project`), `src/app/sitemap.ts`, `next.config.ts` (`serverExternalPackages`), `.gitignore`, `.env.example`, all four `messages/*.json` (new `projectBuilder` namespace — the single largest translation addition in the project so far).

### Final verification results

- `tsc --noEmit`: pass, 0 errors.
- `eslint .`: pass, 0 errors, 0 warnings.
- `vitest run`: pass, 21/21 tests, 2 files, no config warnings.
- `next build`: pass, 93 static pages.
- Migrations: both apply cleanly to a fresh database (verified via the Vitest suite's `beforeAll`, which runs real migrations against a fresh in-memory PGlite instance every run).
- Repository-level smoke check: pass (see above), test data cleaned up.

### Required production environment variables

`DATABASE_URL` (required — app refuses to start without it in production), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`. `PGLITE_DATA_DIR` is development-only and has no effect once `DATABASE_URL` is set.

### Known limitations

- Public-reference generation has no collision-retry loop (astronomically unlikely to matter at this scale; a cheap future addition, not a current gap).
- Rate limiting is in-memory, single-process — fine for now, needs Redis/Upstash before horizontal scaling.
- Lead status lifecycle (12 states) is modeled in the domain layer but nothing yet transitions a lead past `NEW` — that's Phase 5's CRM.
- No admin/internal view of leads exists yet (deliberately deferred per the brief's own Phase 5 boundary); persistence was verified via direct repository/database inspection instead.
- Analytics is a console-only placeholder until a real provider (GA4, Meta, etc.) is configured — the abstraction is ready, nothing is wired to a live provider.

### Next phase

**Phase 5 — Admin + CRM**: a secured internal view of leads/project requests/activities (the first real use of the lead-status lifecycle already modeled), plus the persistence layer for services/case-study/site content currently still living in TypeScript files under `src/content/`.

---

## PHASE 5 — ADMIN DASHBOARD + CRM + LEAD PIPELINE

### Implemented

A secured internal admin system on top of Phase 4's lead tables: cookie-session authentication, minimal RBAC, a dashboard driven entirely by real database aggregates, a searchable/filterable/paginated lead list, a full lead detail view (identity, contact, attribution, project requests with structured briefs, activity timeline, internal notes), a status-change pipeline with a Kanban board, a security/admin audit trail, a small CRM-scoped settings foundation, and CSV export with formula-injection sanitization. Nothing on the dashboard or lead list is fabricated — every figure is a live query result, and empty states render honestly when there's no data yet.

### Auth architecture

No third-party auth provider (Supabase Auth, Auth.js) was added — the "smallest production-suitable" option here was a custom cookie-session system built directly on the existing Postgres/Drizzle stack and Next's own [documented DAL pattern](node_modules/next/dist/docs/01-app/02-guides/authentication.md), which keeps admin auth in the same database as everything else instead of introducing a second system of record for a handful of internal accounts:

- **Password hashing**: Node's built-in `crypto.scrypt` (`src/lib/auth/password.ts`) — no bcrypt/argon2 dependency needed. Stored as `saltHex:hashHex`; verified with `timingSafeEqual`.
- **Sessions**: a signed JWT (`jose`, HS256) in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie, 12h expiry (`src/lib/auth/jwt.ts` + `session.ts`). `ADMIN_SESSION_SECRET` is required in production (throws at startup if missing, same policy as `DATABASE_URL`); in development an ephemeral key is generated per process so `npm run dev` works with zero setup.
- **Two-tier check**, per Next's own guidance: `src/proxy.ts` does an *optimistic* check (JWT signature/expiry only, no DB call) to bounce unauthenticated requests to `/admin` before they render anything. `src/lib/auth/dal.ts`'s `requireActor()` — used in every protected layout, page, server action, and the CSV export route handler — does the *secure* check: it re-fetches the admin_users row by ID, so a demoted or deleted admin can't keep acting on a still-valid token.
- **No signup UI, by design.** Admin accounts are provisioned out-of-band via `npm run admin:create-user -- --email=... --password=... --name="..." --role=OWNER` (`scripts/create-admin-user.ts`), which upserts by normalized email — re-running it with a new password is also the reset path.
- **Login hardening**: Zod-validated credentials, honeypot-free (an internal login form doesn't need one) but rate-limited both by IP and by the attempted email (`loginIpRateLimiter`/`loginEmailRateLimiter`, 10/15min each), a constant-cost dummy password hash so a nonexistent-account lookup takes the same time as a wrong-password check (no user-enumeration timing signal), and generic "Invalid email or password" errors regardless of which was wrong.
- **One real OWNER account was provisioned** for the owner (`brahimcontact64@gmail.com`) against the local dev database during this phase's verification — see the final report message for the one-time password (change it via the same seed command once you're ready).

### RBAC

`OWNER`, `ADMIN`, `SALES`, `EDITOR`, `VIEWER` (`src/domain/admin-user.ts`) — only `OWNER`/`ADMIN` are actually assignable via the seed script today; the other three exist so a future role-gated feature doesn't need a migration. `CRM_EDITOR_ROLES` (OWNER/ADMIN/SALES/EDITOR) gates status changes and notes; `SETTINGS_EDITOR_ROLES` (OWNER only) gates settings writes. Every server action re-checks the role server-side via `assertRole()` (`src/lib/auth/rbac.ts`) — a hidden UI control is never the authorization boundary, per the brief's explicit requirement. The settings page still *renders* a read-only view for non-OWNER roles rather than hiding the section outright, since seeing current configuration isn't sensitive even when editing it is.

### Admin routes

`/admin/*` lives as its own top-level route tree (`src/app/admin/`), a sibling to `src/app/[locale]/`, deliberately outside next-intl's routing — the admin UI is English-only and doesn't share the public site's locale prefixes. It has its own root layout (its own `<html>/<body>`, since Next.js requires that for a top-level segment with no shared parent layout). `src/proxy.ts` was extended to branch on `pathname.startsWith("/admin")` before deciding whether to hand off to next-intl's middleware at all — admin paths never enter next-intl's redirect logic.

### Dashboard

`src/app/admin/(protected)/page.tsx` + `CrmService.getDashboardMetrics()`: total leads, new leads (7d), total project requests, a WON counter, and three real grouped breakdowns (status/source/language) plus a project-type breakdown, rendered as a small dependency-free CSS bar chart (`BarList`) rather than pulling in a charting library for half a dozen numbers. Recent submissions and recent activity lists render an explicit empty state when there's no data — no placeholder numbers, no simulated trend lines.

### Lead list / search / filter / pagination

`src/app/admin/(protected)/leads/page.tsx` + `CrmRepository.listLeads()`: server-side filtering (search across reference/name/email/phone/company via `ilike`, plus status/source/project-type/language filters — project-type uses an `EXISTS` subquery against `project_requests` since a lead can have more than one), server-side sorting, and offset pagination (20/page) — nothing is fetched to the client and filtered in the browser. Filters are a plain `<form method="get">`, so the whole page works with zero client JS and is trivially linkable/bookmarkable. All query construction goes through Drizzle's parameterized query builder — no raw string concatenation, no injection surface.

### Lead detail

`src/app/admin/(protected)/leads/[id]/page.tsx`: identity, contact info, status control, attribution, every project request with its full structured brief and open questions, the activity timeline, and internal notes with an add-note form. The internal database UUID is shown once, labeled "Internal ID," in a dedicated Metadata section — the only place it's exposed, per the brief's "developer/debug context only" rule; everywhere else the public `SP-XXXXXX` reference is what's shown and linked.

### Pipeline / status system

Status changes go through `CrmService.changeLeadStatus()`, which validates the target against the canonical `LEAD_STATUSES` enum (rejecting anything else), rejects a no-op change, writes the new status, and — in the same operation — records a `status_changed` `LeadActivity` (previous status, new status, actor email) *and* an `admin_audit_logs` row. History is never overwritten, only appended to. **Transition policy**: every status currently allows moving to every other status (documented explicitly in `src/domain/lead.ts`) — no workflow restrictions exist yet, since the brief was explicit not to invent rigid business rules without owner input. The only enforcement is that the target must be a real status, so a malformed request can't write an arbitrary string into the column.

The Pipeline board (`/admin/pipeline`) groups a bounded recent working set (500 leads, most-recently-updated first) into Kanban columns by status. Drag-and-drop was deliberately skipped per the brief's own "a select/menu update is acceptable if drag-and-drop adds unnecessary complexity" — each card has the same status `<select>` used on the detail page, which is keyboard-accessible by construction and needs no custom DnD/rollback logic.

### Internal notes

`LeadNote` (new `lead_notes` table): note text, author snapshot (`authorId` + `authorName`, FK `ON DELETE SET NULL` so a note survives the deletion of the account that wrote it), timestamp. Adding a note also writes an `internal_note_added` LeadActivity (with a 140-char preview) and an audit log row. Notes are never rendered anywhere outside `/admin` — no public API or page reads `lead_notes`.

### Activity / audit system

Two distinct trails, deliberately not merged:
- **`lead_activities`** (Phase 4 table, extended with `status_changed` and `internal_note_added`) — the per-lead business timeline, shown on the lead detail page and in a global, paginated `/admin/activities` view.
- **`admin_audit_logs`** (new table) — a system-wide security trail: `login`, `login_failed`, `logout`, `status_changed`, `note_added`, `settings_updated`. Actor is captured as both a FK (`ON DELETE SET NULL`) and a denormalized email snapshot, so the trail survives an account deletion. Surfaced as "Recent admin activity" on the Settings page, OWNER-only, rather than a separate nav item — it's a small enough volume for Phase 5 that a dedicated page would be premature.

### Settings foundation

`site_settings` (key/JSONB value table) + `SettingsService`, covering three keys: `company_identity`, `budget_range_labels`, `lead_source_labels` — each with its own Zod schema, validated before write. **Deliberately scoped down**: this is CRM-internal configuration only. It does **not** rewrite `src/lib/site-config.ts` or change anything on the public marketing site, which keeps reading its own `NEXT_PUBLIC_*` env vars for now, exactly as the brief allowed ("public/business configuration may later move into DB"). Wiring the two together — so an admin edit of the WhatsApp number actually changes the public site — is a Phase 6 candidate, not silently implied to already work. Every settings write is OWNER-only and produces a `settings_updated` audit row.

### Database migrations

One additive migration (`0002_daffy_switch.sql`): four new tables (`admin_users`, `lead_notes`, `admin_audit_logs`, `site_settings`) and two new enum-like columns (`lead_activities.type` already had room for the two new values — no column change needed, it was always free-text `type` validated at the application layer). No existing table was altered, no column dropped, no Phase 4 data touched. Verified applying cleanly to a fresh database via every test file's `beforeAll` (which runs all three migrations against a brand-new in-memory PGlite instance) and via the real dev database used for this phase's manual verification.

### Security

Every admin mutation (`changeLeadStatusAction`, `addLeadNoteAction`, `updateSettingAction`) calls `requireActor()` (DB-verified session) and then `assertRole()` — the actor is always the DB-verified session identity, **never** a value the browser could supply as an argument. Server Actions get CSRF protection from Next's built-in Origin-header check (no extra library needed). Route Handlers (the CSV export) repeat the same `requireActor()` check explicitly, since Route Handlers sit outside the protected layout tree and aren't covered by it. Rate limiting on login (see Auth architecture). No stack traces or raw SQL errors are ever returned to the browser — service-layer results are typed success/error unions, not thrown exceptions, for every expected failure mode.

### CSV export

`/admin/leads/export` (a Route Handler, auth-checked independently), respecting the current list filters, capped at 5,000 rows. `sanitizeCsvCell()` (`src/lib/services/csv-export.ts`) neutralizes spreadsheet formula injection: any cell starting with `=`, `+`, `-`, `@`, a tab, or a carriage return gets a leading `'` prefix before quoting, per the standard OWASP mitigation — verified with a dedicated test using real injection-style payloads.

### Tests

34 new Vitest tests across four files (`admin-auth.test.ts`, `crm-service.test.ts`, `settings-service.test.ts`, `csv-export.test.ts`), on top of Phase 4's 21 — **55 total, all passing**. Coverage: password hash/verify round-trip and rejection, session JWT round-trip/expiry/tamper rejection, RBAC role assertion, lead search/filter/pagination correctness, status-change success + activity/audit-log side effects + invalid-status/no-op/not-found rejection, note creation + side effects + empty/oversized/not-found rejection, dashboard aggregation reflecting real inserted rows (not fixed numbers), pipeline grouping by current status, settings validation (unknown key, invalid value, valid write + audit row), and CSV formula-injection sanitization. `requireActor()`/`assertRole` as re-exported from the DAL aren't imported directly in tests (that file pulls in `next/headers`, which — like `next-intl/server` in Phase 4 — only resolves inside Next's own bundler); the pure role-check logic was split into a dependency-free `src/lib/auth/rbac.ts` specifically so it stays unit-testable without fighting Vitest's module resolution, the same lesson learned in Phase 4.

### Manual verification (no browser automation)

Per the owner's standing policy (see "PROJECT POLICY" above), no Playwright/Cypress/any browser automation was used. Verification was a real, non-mocked script run against the actual local dev database (`.data/pglite-dev`, the same embedded Postgres the dev server uses) — not the test suite's isolated in-memory instance:
1. Ran `npm run admin:create-user` for real, creating the owner's actual OWNER account.
2. A scratch script (deleted after the run, no trace left in the repo) looked up that real account, created a real lead, changed its status through `CrmService`, added a note through `CrmService`, re-read the lead detail to confirm both the activity timeline and the note persisted, ran a dashboard aggregation and a search query against the live table, then deleted only the rows it created.
3. All steps printed real IDs/references/counts confirming genuine round-trip persistence (output preserved in this session's log, not fabricated).

A full click-through in an actual browser (login form → dashboard → lead list → detail → status change → logout) was **not** performed in this session — there was no non-automation-based browser tool available to drive it. This is called out explicitly rather than claimed; the owner should do one short manual pass before relying on this in daily use, which the acceptance criteria describe as an 8-step, non-blocking check.

### Files changed (Phase 5)

New: `src/domain/{admin-user,lead-note,audit-log,settings,admin-auth}.ts`; `src/lib/auth/{password,jwt,session,dal,rbac}.ts`; `src/lib/repositories/{admin-user-repository,crm-repository,audit-log-repository,settings-repository}.ts`; `src/lib/services/{crm-service,settings-service,csv-export}.ts`; `src/lib/actions/{admin-auth,admin-crm,admin-settings}.ts`; `src/lib/admin/format.ts`; `scripts/create-admin-user.ts`; `src/app/admin/**` (layout, login, protected group with dashboard/leads/leads/[id]/leads/export/pipeline/project-requests/activities/settings); `src/components/admin/**`; migration `0002_daffy_switch.sql`; four new Vitest test files. Modified: `src/domain/lead.ts` (two new activity types + `isValidLeadStatus`), `src/lib/db/schema.ts` (four new tables), `src/proxy.ts` (admin branch), `package.json` (`jose` dependency, `tsx` devDependency, `admin:create-user` script), `vitest.config.mts` (`hookTimeout` raised — three PGlite-backed test files now run concurrently and regularly exceeded the 10s default under load), `.env.example` (`ADMIN_SESSION_SECRET` + seed-script usage note).

### Final verification results

TypeScript (`tsc --noEmit`): clean. ESLint: clean. Vitest: **55/55 passing** (21 from Phase 4 + 34 new this phase). Production build (`next build`): succeeds; all `/admin/*` routes correctly compile as server-rendered (`ƒ`), `/admin/login` as static (`○`), the public `[locale]` tree unaffected. Migration verification: passes in every test run (fresh PGlite + all 3 migrations) and against the real dev database. Manual verification: see above.

### Required production environment variables

Everything from Phase 4, plus `ADMIN_SESSION_SECRET` (required — app refuses to start the admin session system without it in production, same policy as `DATABASE_URL`; generate with `openssl rand -base64 32`).

### Known limitations

- Pipeline board shows a capped recent working set (500 leads), not the full paginated dataset — fine at current volume, would need real pagination or virtualization at much larger scale.
- Settings currently cover company identity + two label maps only; they don't yet feed back into the public site's own configuration (intentional Phase 5 scope boundary, see Settings foundation above).
- No lead assignment / ownership field yet ("default lead assignment later" was explicitly out of scope this phase).
- Status transitions are unrestricted (any status → any status) pending the owner's real workflow rules.
- `SameSite=lax` on the session cookie is the standard trade-off Next's own docs use — it blocks cross-site script/fetch reads but still sends the cookie on a top-level GET navigation (e.g. the CSV export link), which is the accepted norm for an internal tool without a dedicated CSRF token on GET requests.
- No browser-driven click-through was performed this session (see Manual verification) — recommend one short manual pass before daily use.

### Next phase

**Phase 6 — AI Consultant**, per the roadmap — plus, as a smaller candidate surfaced by this phase, actually wiring the new Settings foundation into the public site's contact/WhatsApp configuration instead of leaving it CRM-internal only.

---

## PHASE 6 — SIGMA AI CONSULTANT + CRM QUALIFICATION + SETTINGS INTEGRATION

### 0. Mandatory security cleanup (done first, before any feature work)

The temporary OWNER password printed at the end of the Phase 5 report was treated as exposed per the owner's instruction. Searched: all tracked files (`git grep` across every commit — no match), the full working tree (no match), and every memory file this session maintains (no match). It appears in exactly one place outside the local dev database's one-way scrypt hash: this session's own raw conversation transcript (a harness-managed log outside this project's repo and outside anything an agent edits — not a "docs/memory/log artifact" in the sense the instruction meant, the same way a terminal's scrollback isn't). Nothing needed to be scrubbed from tracked or memory storage because nothing was ever written there. The owner's real OWNER account was **not** rotated or deleted automatically, per instruction — **the owner should set a new password before any real/production use**, via the same seed command used to create it. No password appears anywhere in this report or will appear in future ones.

A password-change capability was added to Admin → Settings ("Account security", available to every authenticated role for their own account): requires the current password, validates the new one server-side (12+ chars, at least one letter and one digit — `src/domain/admin-auth.ts`'s `newPasswordSchema`), hashes it with the existing scrypt service, deletes the current session and forces re-login, and records a `password_changed` audit entry (`src/lib/services/account-service.ts`, unit-tested in isolation from cookies/redirects the same way crm-service/settings-service are). Neither password is ever logged, in this feature or anywhere else in the codebase.

### AI architecture

SIGMA AI is a real qualification layer, not a decorative widget: it identifies itself as an AI on every page (never as Brahim or a human), asks only the follow-up questions a given answer actually calls for, grounds every factual claim in the same typed content layer the public site itself renders, and only ever produces text — it holds no tool/function-calling capability and cannot touch the database itself, so a prompt-injection attempt can change what it *says*, never what it *does*. Every actual mutation (a lead getting created) is a separate, explicit, code-gated step downstream of the conversation, never something the model can trigger.

Three cleanly separated concerns, per the brief:
- **`AIProvider`** (`src/lib/ai/provider.ts`) — the only interface the rest of the app depends on. `AnthropicProvider` (`src/lib/ai/anthropic-provider.ts`) is the sole real implementation; no fake second provider was built for appearance's sake, since the brief was explicit not to.
- **`AIConversationService`** (`src/lib/services/ai-conversation-service.ts`) — owns the conversational turn: builds a cost-bounded prompt (recent turns + a rolling summary instead of the full transcript) and streams the reply.
- **`QualificationService`** (`src/lib/services/ai-qualification-service.ts`) — a separate, non-streamed, JSON-only extraction call after each turn. A parse failure here can never break the visible chat; on any failure it just returns the qualification state unchanged.

### Provider / model configuration

`ANTHROPIC_API_KEY` (server-only, never sent to the client) and `AI_MODEL` (defaults to `claude-sonnet-5`) are the only configuration surface, both read once in `src/lib/ai/get-provider.ts`. The model name is never accepted from a request body — `getAIProvider()` is the single source of truth for "AI unavailable" (returns `null` with no key configured), checked before any chat request does anything else and again server-side when the `/ai-consultant` page decides what to render.

### No-API-key fallback (verified for real, not just in theory)

This dev environment has no `ANTHROPIC_API_KEY` configured, so the fallback path described here is exactly what's live at this moment, not a hypothetical: the `/ai-consultant` page renders a genuine unavailable state (`UnavailableNotice`) pointing to the Project Builder, WhatsApp, and Contact page — no fake response is ever generated. Everything else (services, Project Builder, Contact, WhatsApp, CRM) is provably unaffected, since none of it depends on `src/lib/ai/*` at all.

### Streaming

The chat route (`src/app/api/ai/consultant/route.ts`, POST) streams Server-Sent Events over a hand-rolled `ReadableStream` — no client dependency needed for a `token`/`qualification`/`error`/`done` event set this small. `AbortController`/`request.signal` is threaded through to the Anthropic SDK call itself, so clicking "stop" in the UI actually cancels the upstream request (real cost control, not just a UI-side truncation). The client (`src/lib/ai/chat-client.ts`) parses the SSE frames manually and appends tokens progressively; the composer disables re-submission while a reply is streaming.

### Qualification domain model — inferred vs. confirmed

`src/domain/ai-qualification.ts`: every extracted field (`QualificationField<T>`) carries `{ value, confidence, sourceMessageId }`, where `confidence` is `INFERRED` or `USER_CONFIRMED`. **Everything an extraction pass writes is `INFERRED` — never anything else, regardless of how confident the model's own phrasing sounds.** A field already `USER_CONFIRMED` is frozen against being silently overwritten by a later inference (`mergeInferredQualification`, unit-tested for exactly this). The AI Consultant panel's `QualificationCard` visually marks every unconfirmed field as an "AI guess," lets the visitor edit any scalar field inline (which immediately marks it confirmed, since they just said so directly), and has a single "This looks right, confirm" action that promotes every currently-populated field to `USER_CONFIRMED` at once (`confirmAllInferred`) before either handoff path. The extraction schema itself is the first guardrail against a fabricated value: every canonical-ID field is validated against the same Zod enums the Project Builder uses (`PROJECT_TYPES`, `PROJECT_GOALS`, etc.) — a value the model invents that isn't one of these is dropped, not stored.

### Qualification strategy

No fixed 20-question script — the system prompt (`src/lib/ai/system-prompt.ts`) instructs the model to ask only what's actually useful and to prioritize clarifying the product before asking about budget. Extraction runs as its own call after every turn rather than interleaving structured output with the conversational reply, keeping the two failure domains independent.

### Project Builder handoff

"Continue with Project Builder" never touches the URL or makes a server round trip for the handoff itself: the qualification state (filtered down to `ProjectBuilderPrefill` — canonical IDs only, re-validated against the same enums a second time in `qualification-to-builder.ts` as defense-in-depth against tampering) is written once to `sessionStorage`, the visitor is routed to `/start-project?from=ai`, and `ProjectBuilder` reads and immediately clears that entry on mount — a page refresh afterward behaves exactly like a normal fresh visit. Every prefilled value remains fully editable through the Project Builder's existing step navigation and summary screen, unchanged from Phase 4.

### AI → Lead / CRM integration

**Opening the AI consultant never creates a lead.** A real lead is only created when the visitor explicitly clicks "Request a proposal" and submits their contact details (`requestAiProposalAction`, `src/lib/actions/ai-consultant.ts`), which goes through **the exact same `submitProjectRequest()` Phase 4 built** — `qualificationToSubmitInput()` maps whatever the AI actually gathered onto a full `SubmitProjectRequestInput`, defaulting anything missing to the same honest neutral values (`not-sure`/`flexible`/`new-idea`/empty arrays) the Contact-page minimal-brief path already uses. No second, bypassing write path into `leads`/`project_requests` exists. On success, the conversation is linked to the new lead (`ai_conversations.leadId`, status `converted`) and a short, honest retrospective trail is written to that lead's own timeline — `ai_consultation_started`, `ai_qualification_completed` (only if qualification actually reached the same "minimal" bar the Builder handoff button uses), `ai_brief_confirmed` (only if the visitor used the confirm action), `ai_lead_created` — never one entry per chat message. `ai_handoff_to_builder` is logged only in the (rarer) case a conversation already has a linked lead when the visitor also opens the Builder from it.

### Conversation persistence

Two additive tables (migration `0003_striped_lady_mastermind.sql`): `ai_conversations` (sessionId, locale, nullable `leadId`/`projectRequestId`, status, the current `qualificationState` JSONB snapshot, an optional rolling `summary`) and `ai_messages` (role, content, `conversationId`). No separate qualification-snapshot-history table was built — the brief listed it as a "possible" table, not required, and a single current-state JSONB column is the simplest design that satisfies every actual acceptance criterion; a full audit history of every qualification revision would be a reasonable but currently unjustified addition. `sessionId` is an anonymous, browser-generated (`crypto.randomUUID()`, localStorage) identifier — not an auth mechanism, just enough to scope/resume a conversation and to rate-limit abuse per-session as well as per-IP.

### Admin AI view

Lead Detail shows an "AI Consultation" section when one exists (`AiConsultationSection`): the AI-generated summary (explicitly labeled as AI-generated, never presented as the client's own wording), client-confirmed fields only, AI-recommended services, open questions, and the full transcript inside a collapsed `<details>` — never dumped inline into the main page.

### Public settings integration (closing the Phase 5 gap)

`site_settings.company_identity` now actually feeds the public site through one canonical accessor, `getEffectiveSiteConfig()` (`src/lib/effective-config.ts`): DB value overrides the `NEXT_PUBLIC_*`-env-based `siteConfig` default per field, falling back cleanly if a field is unset *or if the database itself is unreachable* (verified for real — this dev environment has no `DATABASE_URL`, so every static page built during `next build` exercised the exact "DB unavailable, fall back to env" branch and produced a fully correct site regardless; see the build log). Cached via `unstable_cache` (5 min TTL, tag-invalidated), with `updateSettingAction` calling `revalidateTag` (Next 16 changed this to require a cache-life-profile second argument — see gotchas below) immediately after a `company_identity` write so an admin's change is visible right away rather than waiting out the TTL. The pure "override merged over defaults" logic lives in a separate, Next-cache-free module (`src/lib/site-config-merge.ts`) specifically so it stays unit-testable, mirroring the `rbac.ts` split from Phase 5.

### WhatsApp — one canonical resolution path

`getEffectiveWhatsAppUrl()` (same file) is now the one function every user-facing entry point calls: header, footer, homepage hero/CTA, Contact page, and both post-submission WhatsApp-summary builders (`buildProjectRequestWhatsAppUrl`/`buildContactWhatsAppUrl`). The old `buildWhatsAppUrl()` (`src/lib/whatsapp.ts`) still exists and is still used, but only as the deliberate last-resort, DB-independent fallback for the two spots that already needed one (a WhatsApp-link-construction failure *after* a successful Phase-4 submission) — it was never removed because that fallback must keep working even if the database itself is the thing that's down.

### Budget range configuration

Budget range labels remain CRM-internal only this phase (Phase 5's `budget_range_labels` setting), now actually consumable via the same effective-config pattern — but not retrofitted into the public, multilingual Project Builder UI, since doing so properly needs a locale dimension the current flat label map doesn't have, and forcing it in now would risk regressing the four-language Project Builder for a lower-priority win. Canonical budget IDs stored on historical `ProjectRequest` rows are untouched either way. Documented, per the brief's own allowance, as the deliberate remaining step rather than something silently skipped.

### Rate limiting / cost controls

AI endpoints get their own, stricter limiters (`aiMessageSessionRateLimiter`: 20/10min per session, `aiMessageIpRateLimiter`: 40/10min per IP) on top of the existing in-memory abstraction — same documented "needs Redis before horizontal scaling" caveat as every other limiter in this codebase. Server-enforced, independent of anything the UI does: max message length (2000 chars, rejected by Zod before the request is even processed), max conversation length (60 messages, then the client is told to start fresh or continue via the Builder), a 24h conversation expiry, and a hard `max_tokens` cap (700) on every model call. History sent to the model is capped to the most recent 16 turns; a rolling AI-generated summary (regenerated every 12 messages once the window is exceeded) substitutes for the trimmed-off older turns, so a long conversation's cost doesn't grow unbounded.

### Privacy / PII controls

No unrelated CRM data (internal notes, audit logs, other leads) is ever sent to the AI provider — the system prompt is built from static public content plus the current conversation only. Contact details are collected exactly once, only after the visitor explicitly asks for a proposal, with an explicit statement of purpose in the capture form. Analytics events (`ai_consultant_viewed`, `ai_consultation_started`, `ai_message_sent`, `ai_qualification_updated`, `ai_builder_handoff`, `ai_contact_requested`, `ai_error`) carry no message text, email, phone, or name — booleans/IDs/counts only, same rule Phase 4 established.

### Prompt-injection defense

The system prompt explicitly instructs the model to ignore any user-message instruction asking it to reveal its own prompt, reveal secrets, claim database access, or bypass the pricing/commitment rules — but the real enforcement, per the brief's own framing, is architectural: the model has no tools, no database access, and no ability to author anything except the text shown in the chat bubble and the JSON consumed by the (separately validated) extraction schema. There is no code path by which conversation text can become an authorization decision.

### Database migrations

One additive migration (`admin_users`/`lead_notes`/`admin_audit_logs`/`site_settings` from Phase 5 untouched): `ai_conversations`, `ai_messages`. No existing table altered, no Phase 4/5 data touched — verified against a fresh database in every test run and against the real dev database via a scratch script (see Manual verification).

### Tests

55 new Vitest tests across 10 files — the mandatory security-cleanup password-change service (current-password check, weak-password rejection, mismatch rejection, hash update + audit entry), qualification merge/confirm/minimal-bar logic (pure domain), extraction against a fake provider (valid JSON, prose-wrapped JSON, invented canonical IDs rejected, malformed JSON, provider failure — all fall back safely), conversation-service prompt trimming and summary-update triggering, the AI conversation repository (session-ownership enforcement, message ordering/counting, qualification/summary persistence, lead-linking including the real FK constraint), the chat-request Zod schema (UUID/locale/length/strict-mode rejection) and the two new rate limiters, the effective-config merge logic, the Project-Builder-prefill mapping (including a simulated tampered-sessionStorage value being dropped, not passed through), the qualification-to-lead mapping (defaults, AI-gathered values, summary labeling, attribution passthrough), and a real end-to-end run of an AI-sourced submission through the actual `submitProjectRequest()` (not a mock of it). **110 total tests passing** (55 carried forward from Phase 4/5 + 55 new this phase).

### Manual verification (no browser automation)

Per the durable owner policy, no Playwright/Cypress/browser automation was used. Two real, non-mocked checks:
1. **Production build** (`next build`, no `DATABASE_URL` set) — every static page for every locale built successfully while genuinely exercising the "settings DB unreachable → fall back to env `siteConfig`" branch for real (visible in the build log), not simulated. `/ai-consultant` compiled correctly per locale; `/api/ai/consultant` compiled as a dynamic route; `/admin/login` is now correctly dynamic (it reads a `passwordChanged` search param).
2. **A scratch script** (deleted after the run, no trace left) against the real local dev database: created a conversation, streamed a reply through a fake provider, ran real qualification extraction and persistence, then — separately, via a proper Vitest integration test rather than fighting the same `next-intl`-outside-Next limitation Phase 4 already documented — verified the AI-sourced submission travels through the actual `submitProjectRequest()` end to end, including a real database row for the resulting lead and the conversation correctly linking back to it.

A real browser click-through (open `/ai-consultant`, hold a conversation, confirm qualification, hand off to the Builder, see the prefilled values) was **not** performed this session, for the same reason as Phase 5: no non-automation browser tool was available. Recommend one short manual pass before relying on this daily, ideally once `ANTHROPIC_API_KEY` is configured so the real conversational behavior (including Arabic/Darija handling) can be judged directly rather than only through its unavailable-state fallback.

### New technical gotchas found this phase (also added to persistent memory for future sessions)

- **Next 16 changed `revalidateTag`'s signature** — it now requires a second "cache profile" argument (e.g. `revalidateTag(tag, "max")`); the old one-argument call throws a type error. `updateTag(tag)` (single-argument, Server-Action-only) is the newer, narrower alternative for "read-your-own-writes" — not used here since `unstable_cache` (the legacy, still-supported caching primitive this codebase uses) pairs with `revalidateTag`, not `updateTag`.
- **The `server-only` npm package isn't actually installed in this project** (not a dependency, not in `node_modules`) — Next's own bundler resolves the specifier internally regardless, but that means any file that `import "server-only"` (directly or transitively) cannot be loaded from a plain `tsx` script outside Next, not just Vitest. Confirmed by hand this phase: `src/lib/ai/get-provider.ts` (which has this import) failed with `MODULE_NOT_FOUND` from a standalone smoke script, which is *stricter* than the already-known Vitest behavior (which at least resolves the module before its guarded throw). Same underlying lesson as Phase 5's `server-only`/Vitest split, now confirmed to also block ad hoc verification scripts, not just the test runner.
- **Vitest concurrency vs. PGlite**: with 16 integration test files (Phase 6), running them all fully parallel occasionally blew past even the Phase-5-raised 30s hook timeout under load. Capped via `maxWorkers: 4` in `vitest.config.mts` rather than raising the timeout further — a bounded number of concurrent PGlite instances is a more scalable fix than an ever-increasing timeout as the suite keeps growing.

### Files changed (Phase 6)

New: `src/domain/{ai-conversation,ai-qualification,ai-chat,ai-lead-capture}.ts`; `src/lib/ai/{provider,anthropic-provider,get-provider,knowledge,system-prompt,session-id,chat-client,qualification-to-builder,qualification-to-project-request}.ts`; `src/lib/repositories/ai-conversation-repository.ts`; `src/lib/services/{ai-conversation-service,ai-qualification-service,account-service}.ts`; `src/lib/actions/ai-consultant.ts`; `src/lib/effective-config.ts` + `src/lib/site-config-merge.ts`; `src/app/api/ai/consultant/route.ts`; `src/app/[locale]/ai-consultant/page.tsx`; `src/components/ai-consultant/**`; `src/components/admin/{ai-consultation-section,change-password-form}.tsx`; migration `0003_striped_lady_mastermind.sql`; 9 new Vitest test files. Modified: `src/domain/{lead,audit-log,admin-auth}.ts` (new activity/audit types, password schema), `src/lib/db/schema.ts` (two new tables), `src/lib/actions/admin-auth.ts` (`changePasswordAction`), `src/lib/repositories/admin-user-repository.ts` (`updatePassword`), `src/lib/actions/admin-settings.ts` (cache invalidation), `src/lib/integrations/analytics.ts` (new AI events), `src/lib/security/rate-limit.ts` (AI limiters), `src/lib/whatsapp.ts`/`src/lib/services/whatsapp-summary.ts` (doc-comment + effective-config wiring), `src/components/{site-header,site-footer,header-client}.tsx` + `src/app/[locale]/{page,contact/page}.tsx` + `src/components/sections/cta-section.tsx` (effective-config wiring, nav entry point), `src/components/project-builder/{project-builder,types}.tsx` (sessionStorage AI handoff), `src/app/[locale]/start-project/page.tsx` (Suspense boundary for `useSearchParams`), `src/app/admin/(protected)/{settings/page.tsx,leads/[id]/page.tsx}` (password form, AI section), all four `messages/*.json` (new `aiConsultant` namespace + nav key), `vitest.config.mts` (`maxWorkers`), `.env.example` (`ANTHROPIC_API_KEY`, `AI_MODEL`).

### Final verification results

TypeScript (`tsc --noEmit`): clean. ESLint: clean. Vitest: **110/110 passing** (55 carried forward + 55 new this phase, confirmed stable across repeated runs). Production build (`next build`): succeeds; `/ai-consultant` and `/admin/*` compile correctly, `/api/ai/consultant` compiles as a dynamic Route Handler. Migration verification: passes in every test run (fresh PGlite + all 4 migrations) and against the real dev database via the scratch script described above.

### Required production environment variables

Everything from Phases 4-5, plus `ANTHROPIC_API_KEY` (optional — omitting it keeps the AI Consultant in its honest unavailable state; everything else on the site is unaffected) and `AI_MODEL` (optional, defaults to `claude-sonnet-5`).

### Known limitations

- No browser click-through was performed this session (see Manual verification) — recommend one short pass, ideally with a real API key configured, before relying on this daily.
- Budget range labels remain CRM-internal only; not wired into the public multilingual Project Builder UI this phase (see Budget range configuration above) — documented as the deliberate remaining step, not an oversight.
- No qualification-history/audit table — only the current merged state is retained per conversation, not a revision-by-revision log (a reasonable scope trim; nothing in the acceptance criteria required it).
- AI cost controls are real but conservative estimates (16-turn window, 700-token replies, 60-message/24h conversation caps) — worth revisiting once real usage data exists.
- Rate limiting remains in-memory/single-process, same standing caveat as every other limiter in this codebase.
- The owner's OWNER account still has the Phase-5-issued temporary password until it's changed via the new Account Security section or the seed script — this is flagged, not silently left as-is.

### Next phase

**Phase 7 — Technical SEO foundation**, per the roadmap.

---

## ROADMAP / TODO

- [x] Phase 0 — Audit (this document)
- [x] Phase 1 — Architecture, design tokens, branding foundation, i18n routing skeleton
- [x] Phase 2 — Flagship visual identity (hero, 3D object, motion system, scroll story, navigation)
- [x] Phase 3 — Services + portfolio + case studies
- [x] Phase 4 — Project Builder + lead capture + WhatsApp
- [x] Phase 5 — Admin + CRM
- [x] Phase 6 — AI Consultant
- [ ] Phase 7 — Technical SEO foundation
- [ ] Phase 8 — SIGMA SEO intelligence engine
- [ ] Phase 9 — Blog/content platform
- [ ] Phase 10 — Analytics, observability, optimization, security hardening
- [ ] Phase 11 — Full E2E + production readiness

## OPEN ITEMS REQUIRING OWNER INPUT (not blockers, tracked for later phases)

- Real case-study content (challenge/strategy/outcome, live/repo URLs, dates) for SahEat, e-Vizza, Eleman Shoes, Dzenix
- Confirmation of which phone number is the primary SIGMA+ WhatsApp/business line (+213 vs +43 numbers both appear in source material)
- Real, consented testimonials (none currently exist that can be verified)
- Founder/team bio content for the About page
- SIGMA+ brand mark (logo) — none exists yet
