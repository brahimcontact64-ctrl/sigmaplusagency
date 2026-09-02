import type { SeoKeywordSeed } from "@/domain/seo-intelligence";

/**
 * The Algeria-first search-intent hypotheses from docs/SEO_STRATEGY.md
 * §13, in code form so the weekly keyword-analysis job (Phase 12 §7)
 * has real seeds to check once a real SERP provider exists. These stay
 * **hypotheses** — no volume/difficulty/ranking claim is made anywhere
 * — until real provider data validates or disproves them (§13's own
 * policy: adjust existing page copy, never create a doorway page per
 * keyword variation).
 */
export const KEYWORD_HYPOTHESES: SeoKeywordSeed[] = [
  { keyword: "création site web Algérie", country: "DZ", language: "fr" },
  { keyword: "agence web Alger", country: "DZ", language: "fr" },
  { keyword: "développement application mobile Algérie", country: "DZ", language: "fr" },
  { keyword: "agence développement web Algérie", country: "DZ", language: "fr" },
  { keyword: "développement logiciel Algérie", country: "DZ", language: "fr" },
  { keyword: "création boutique en ligne Algérie", country: "DZ", language: "fr" },
  { keyword: "agence digitale Algérie", country: "DZ", language: "fr" },
  { keyword: "AI agency Algeria", country: "DZ", language: "en" },
  { keyword: "automatisation entreprise Algérie", country: "DZ", language: "fr" },
];
