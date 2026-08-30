# Case study — owner input needed

This tracks exactly what's missing to turn each Phase-3 case study from an honest product summary into a full narrative case study. Nothing below is blocking — the pages are live now with only verified facts. Fill in a section for a project and its corresponding public sections (challenge / strategy / implementation / outcome) can be added.

Data model: `src/domain/case-study.ts` (`CaseStudyMeta`, `CaseStudyContent`). Locale-independent facts live in `src/content/case-studies/meta.ts`; per-language prose lives in `src/content/case-studies/{locale}.ts`. Each project's `contentStatus` is `PARTIAL` until this is filled in.

For each of SahEat, e-Vizza, Eleman Shoes, and Dzenix, we still need:

- **Original problem** — what the client/business actually struggled with before the project.
- **Business goal** — what success was supposed to look like for them.
- **Your role** — did you design, build, or both? Solo or with others?
- **Time period** — approximate year(s) worked on it (`meta.ts`'s `year` field is currently omitted, not guessed).
- **Main technical challenge** — the hardest engineering problem solved, specifically.
- **Business challenge** — any non-technical constraint that shaped the solution (budget, timeline, market).
- **Key solution decisions** — why you built it the way you did, not just what it does.
- **Real measurable results**, if any exist and can be shared honestly (orders processed, users onboarded, time saved — only if you can actually stand behind the number).
- **A real client quote**, only if you have one and the client is fine with it being public.
- **Production URL**, if the product is still live and you want it linked.
- **Screenshots**, if you have real ones and are allowed to share them (the current pages deliberately use no imagery rather than the old placeholder title-cards found in `Downloads/portfolio_images/` — see the Phase 2 report for why those were rejected).
- **Permission to name the client/brand publicly**, if the "client" is a separate company from the product name itself.
- **Exact tech stack actually used** — the current pages don't claim specific frameworks/tools per project because that wasn't verified from any source material; only SIGMA+'s general service-level technology lists are shown.

Once any of this is supplied, update the corresponding entry in `src/content/case-studies/meta.ts` (facts) and `src/content/case-studies/{locale}.ts` (the `narrative` object's `challenge` / `strategy` / `implementation` / `qualitativeOutcome` fields, one language at a time) — the page components already render these sections conditionally and will pick them up automatically.
