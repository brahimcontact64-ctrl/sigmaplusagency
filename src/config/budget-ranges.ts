import type { CurrencyCode } from "@/lib/money";

/**
 * Budget ranges are configuration, not a hardcoded UI list — per the
 * master plan's Project Builder spec ("Budget ranges must be
 * admin/configurable later... do not bury them directly in UI
 * components"). This file is the single place to change them until a
 * real admin panel can edit them at runtime.
 *
 * **These are LEAD QUALIFICATION budget bands, not SIGMA+'s own price
 * list** (Phase 11 §6) — a prospective client self-reports which
 * bucket they can spend, purely to help triage the lead. That
 * semantic distinction is why the DZD figures below are their own
 * explicit, editorially-set bands for the Algerian market, not a
 * literal EUR×FX conversion pasted through the UI: a meaningful local
 * budget bucket doesn't have to track EUR purchasing power 1:1, and
 * this codebase never fetches a live FX rate to render a page (that
 * would be slow, unreliable, and unnecessary for a qualification
 * bucket). The DZD amounts here were derived from a conservative,
 * clearly-labeled ESTIMATE exchange rate (~1 EUR ≈ 145 DZD, rounded to
 * clean numbers) as a first-pass default — the owner should review
 * these against real regional pricing expectations before relying on
 * them for anything beyond qualification triage.
 *
 * The `id` is the ONLY thing ever persisted on a lead/project request
 * — stable, currency-independent, unchanged by this file. Everything
 * else here is presentation.
 */
export type BudgetAmounts = { min?: number; max?: number };

export type BudgetRange = {
  id: string;
  /** Per-currency amount bands. A currency with no explicit entry falls back to EUR (see `getBudgetAmounts`) rather than crashing — safe-by-default for a future currency added to `SUPPORTED_CURRENCIES` before its bands are configured here. */
  amounts: Partial<Record<CurrencyCode, BudgetAmounts>>;
};

export const BUDGET_RANGES: BudgetRange[] = [
  { id: "under-1000", amounts: { EUR: { max: 1000 }, DZD: { max: 150_000 } } },
  { id: "1000-5000", amounts: { EUR: { min: 1000, max: 5000 }, DZD: { min: 150_000, max: 700_000 } } },
  { id: "5000-15000", amounts: { EUR: { min: 5000, max: 15000 }, DZD: { min: 700_000, max: 2_000_000 } } },
  { id: "15000-plus", amounts: { EUR: { min: 15000 }, DZD: { min: 2_000_000 } } },
  { id: "not-sure", amounts: {} },
];

export const BUDGET_RANGE_IDS = BUDGET_RANGES.map((r) => r.id);

export function getBudgetRange(id: string): BudgetRange | undefined {
  return BUDGET_RANGES.find((r) => r.id === id);
}

export function getBudgetAmounts(range: BudgetRange, currency: CurrencyCode): BudgetAmounts | undefined {
  return range.amounts[currency] ?? range.amounts.EUR;
}

/** Whole-number currency formatting for a round bucket boundary (e.g. "€5,000", "700 000 DZD") — deliberately not `money.ts`'s `formatMoney`, which always shows minor-unit decimals and is meant for exact stored amounts, not qualification buckets. */
export function formatBudgetAmount(amount: number, currency: CurrencyCode, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export type BudgetRangeDescription =
  | { kind: "between"; min: string; max: string }
  | { kind: "under"; amount: string }
  | { kind: "over"; amount: string }
  | { kind: "unspecified" };

/** Formats a range's amounts for the given currency/locale into one of four shapes — the caller (which already has next-intl's `t`) turns this into localized copy via `budgetTemplates.{between,under,over,notSure}`, so phrasing stays fully translator-controlled rather than assembled by string concatenation here. */
export function describeBudgetRange(range: BudgetRange, currency: CurrencyCode, locale: string): BudgetRangeDescription {
  const amounts = getBudgetAmounts(range, currency);
  if (!amounts || (amounts.min === undefined && amounts.max === undefined)) {
    return { kind: "unspecified" };
  }
  if (amounts.min !== undefined && amounts.max !== undefined) {
    return { kind: "between", min: formatBudgetAmount(amounts.min, currency, locale), max: formatBudgetAmount(amounts.max, currency, locale) };
  }
  if (amounts.max !== undefined) {
    return { kind: "under", amount: formatBudgetAmount(amounts.max, currency, locale) };
  }
  return { kind: "over", amount: formatBudgetAmount(amounts.min!, currency, locale) };
}

/** `translate` is next-intl's `t` scoped to `projectBuilder.budgetTemplates` (or an equivalent), injected rather than imported here so this module stays a plain, dependency-free, directly-testable unit. */
export type BudgetRangeTemplateTranslator = (key: "between" | "under" | "over" | "notSure", values?: Record<string, string>) => string;

export function formatBudgetRangeLabel(
  range: BudgetRange,
  currency: CurrencyCode,
  locale: string,
  translate: BudgetRangeTemplateTranslator,
): string {
  const described = describeBudgetRange(range, currency, locale);
  switch (described.kind) {
    case "between":
      return translate("between", { min: described.min, max: described.max });
    case "under":
      return translate("under", { amount: described.amount });
    case "over":
      return translate("over", { amount: described.amount });
    case "unspecified":
      return translate("notSure");
  }
}
