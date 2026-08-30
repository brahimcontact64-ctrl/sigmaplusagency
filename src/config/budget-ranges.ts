/**
 * Budget ranges are configuration, not a hardcoded UI list — per the
 * master plan's Project Builder spec ("Budget ranges must be
 * admin/configurable later... do not bury them directly in UI
 * components"). This file is the single place to change them until a
 * real admin panel (Phase 5) can edit them at runtime. IDs are stable;
 * only the labels (resolved via messages/*.json `projectBuilder.budget`)
 * and the min/max shown to admins later would change.
 */
export type BudgetRange = {
  id: string;
  minEur?: number;
  maxEur?: number;
};

export const BUDGET_RANGES: BudgetRange[] = [
  { id: "under-1000", minEur: 0, maxEur: 1000 },
  { id: "1000-5000", minEur: 1000, maxEur: 5000 },
  { id: "5000-15000", minEur: 5000, maxEur: 15000 },
  { id: "15000-plus", minEur: 15000 },
  { id: "not-sure" },
];

export const BUDGET_RANGE_IDS = BUDGET_RANGES.map((r) => r.id);
