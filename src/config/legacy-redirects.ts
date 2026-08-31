/**
 * Verified old-Brahim-Dev → SIGMA+ URL mappings, consumed by
 * `redirects()` in next.config.ts. See docs/SEO_STRATEGY.md "Legacy
 * migration" for the full reasoning.
 *
 * This is deliberately empty right now, not an oversight: per the
 * Phase 0 audit (docs/SIGMA_PLUS_MASTER_PLAN.md "PHASE 0 — AUDIT"),
 * the old live site (brahim-dev.vercel.app) has **no confirmed
 * indexable subpage URLs** — no sitemap, no robots.txt, and every
 * local snapshot shows a single-page app with in-page anchors
 * (#services, #projets, #contact), not real routes. There is nothing
 * to verify a redirect *from*, so inventing service/project-level
 * mappings here would violate the explicit "do not invent redirects
 * for URLs that never existed" rule.
 *
 * The only plausible future entry is the bare locale root
 * (brahim-dev.vercel.app/fr → sigmaplus.agency/fr and so on) — but
 * that only matters if/when the old domain is ever pointed at this
 * app, which is a DNS/infrastructure decision for the owner, not
 * something this codebase can decide unilaterally. Add real entries
 * here (source path -> destination path, both without a locale
 * prefix — see next.config.ts for how the prefix is applied) only
 * once a specific legacy URL is confirmed to exist and to have a
 * genuine equivalent on the new site.
 */
export type LegacyRedirect = {
  /** Source path, no locale prefix, e.g. "/anciens-projets" */
  source: string;
  /** Destination path, no locale prefix, e.g. "/work" */
  destination: string;
  /** Always true — a redirect entered here must be genuinely permanent, never a temporary one added "for now". */
  permanent: true;
};

export const LEGACY_REDIRECTS: LegacyRedirect[] = [];
