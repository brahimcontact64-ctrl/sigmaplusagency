import { describe, it, expect } from "vitest";
import {
  BUDGET_RANGES,
  BUDGET_RANGE_IDS,
  getBudgetRange,
  getBudgetAmounts,
  describeBudgetRange,
  formatBudgetAmount,
  formatBudgetRangeLabel,
} from "@/config/budget-ranges";

describe("getBudgetRange / getBudgetAmounts", () => {
  it("finds a range by its stable id", () => {
    expect(getBudgetRange("5000-15000")?.id).toBe("5000-15000");
    expect(getBudgetRange("nonexistent-id")).toBeUndefined();
  });

  it("returns explicit DZD amounts distinct from a literal EUR conversion", () => {
    const range = getBudgetRange("5000-15000")!;
    const eur = getBudgetAmounts(range, "EUR");
    const dzd = getBudgetAmounts(range, "DZD");
    expect(eur).toEqual({ min: 5000, max: 15000 });
    expect(dzd).toEqual({ min: 700_000, max: 2_000_000 });
  });

  it("falls back to EUR amounts for a currency with no explicit band configured", () => {
    const range = getBudgetRange("5000-15000")!;
    // GBP is a supported currency generally but has no explicit band
    // configured for this range yet — must fall back to EUR, not crash.
    const amounts = getBudgetAmounts(range, "GBP");
    expect(amounts).toEqual({ min: 5000, max: 15000 });
  });

  it("the not-sure range has no amounts in any currency", () => {
    const range = getBudgetRange("not-sure")!;
    expect(getBudgetAmounts(range, "EUR")).toBeUndefined();
    expect(getBudgetAmounts(range, "DZD")).toBeUndefined();
  });
});

describe("BUDGET_RANGE_IDS", () => {
  it("stays in sync with BUDGET_RANGES and is stable/currency-independent", () => {
    expect(BUDGET_RANGE_IDS).toEqual(BUDGET_RANGES.map((r) => r.id));
    expect(BUDGET_RANGE_IDS).toContain("under-1000");
    expect(BUDGET_RANGE_IDS).toContain("not-sure");
  });
});

describe("formatBudgetAmount", () => {
  it("formats a whole-number amount with no decimals", () => {
    expect(formatBudgetAmount(1000, "EUR", "en-US")).toBe("€1,000");
    expect(formatBudgetAmount(700_000, "DZD", "en-US")).not.toContain(".00");
  });
});

describe("describeBudgetRange", () => {
  it("describes a between-range with both min and max", () => {
    const range = getBudgetRange("1000-5000")!;
    const described = describeBudgetRange(range, "EUR", "en-US");
    expect(described).toEqual({ kind: "between", min: "€1,000", max: "€5,000" });
  });

  it("describes an under-range with only a max", () => {
    const range = getBudgetRange("under-1000")!;
    const described = describeBudgetRange(range, "EUR", "en-US");
    expect(described).toEqual({ kind: "under", amount: "€1,000" });
  });

  it("describes an over-range with only a min", () => {
    const range = getBudgetRange("15000-plus")!;
    const described = describeBudgetRange(range, "EUR", "en-US");
    expect(described).toEqual({ kind: "over", amount: "€15,000" });
  });

  it("describes not-sure as unspecified", () => {
    const range = getBudgetRange("not-sure")!;
    expect(describeBudgetRange(range, "EUR", "en-US")).toEqual({ kind: "unspecified" });
  });

  it("produces genuinely different amounts for DZD vs EUR, not a display-only relabel", () => {
    const range = getBudgetRange("5000-15000")!;
    const eur = describeBudgetRange(range, "EUR", "en-US");
    const dzd = describeBudgetRange(range, "DZD", "fr");
    expect(eur.kind).toBe("between");
    expect(dzd.kind).toBe("between");
    if (eur.kind === "between" && dzd.kind === "between") {
      expect(eur.min).not.toBe(dzd.min);
    }
  });
});

describe("formatBudgetRangeLabel", () => {
  const translate = (key: "between" | "under" | "over" | "notSure", values?: Record<string, string>) => {
    switch (key) {
      case "between":
        return `${values!.min} – ${values!.max}`;
      case "under":
        return `Under ${values!.amount}`;
      case "over":
        return `Over ${values!.amount}`;
      case "notSure":
        return "Not sure yet";
    }
  };

  it("produces the expected label shape for each range kind", () => {
    expect(formatBudgetRangeLabel(getBudgetRange("under-1000")!, "EUR", "en-US", translate)).toBe("Under €1,000");
    expect(formatBudgetRangeLabel(getBudgetRange("15000-plus")!, "EUR", "en-US", translate)).toBe("Over €15,000");
    expect(formatBudgetRangeLabel(getBudgetRange("not-sure")!, "EUR", "en-US", translate)).toBe("Not sure yet");
  });

  it("never hardcodes EUR — DZD produces a DZD-labeled string", () => {
    const label = formatBudgetRangeLabel(getBudgetRange("under-1000")!, "DZD", "fr", translate);
    expect(label).toContain("DZD");
    expect(label).not.toContain("€");
  });
});
