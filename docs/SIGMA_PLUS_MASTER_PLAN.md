# SIGMA PLUS AGENCY — Master Plan

Status: living document. Updated at the end of every phase.
Last updated: 2026-08-30 (Phase 0 complete, Phase 1 in progress).

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

## ROADMAP / TODO

- [x] Phase 0 — Audit (this document)
- [ ] Phase 1 — Architecture, design tokens, branding foundation, i18n routing skeleton
- [ ] Phase 2 — Homepage flagship experience
- [ ] Phase 3 — Services + portfolio + case studies
- [ ] Phase 4 — Project Builder + lead capture + WhatsApp
- [ ] Phase 5 — Admin + CRM
- [ ] Phase 6 — AI Consultant
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
