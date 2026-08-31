import { describe, it, expect } from "vitest";
import { lastNDaysRange, comparisonRange, safeRate, percentChange } from "@/lib/analytics/rates";

describe("lastNDaysRange", () => {
  it("builds a [start, end) window of exactly N days ending at the next UTC day boundary", () => {
    const now = new Date("2026-01-15T14:30:00.000Z");
    const range = lastNDaysRange(7, now);
    expect(range.end.toISOString()).toBe("2026-01-16T00:00:00.000Z");
    expect(range.start.toISOString()).toBe("2026-01-09T00:00:00.000Z");
  });
});

describe("comparisonRange", () => {
  it("returns the immediately preceding period of the same length", () => {
    const range = { start: new Date("2026-01-09T00:00:00.000Z"), end: new Date("2026-01-16T00:00:00.000Z") };
    const comparison = comparisonRange(range);
    expect(comparison.end).toEqual(range.start);
    expect(comparison.end.getTime() - comparison.start.getTime()).toBe(range.end.getTime() - range.start.getTime());
  });
});

describe("safeRate", () => {
  it("divides normally when the denominator is positive", () => {
    expect(safeRate(1, 4)).toBe(0.25);
  });

  it("returns null instead of Infinity/NaN for a zero denominator", () => {
    expect(safeRate(5, 0)).toBeNull();
  });

  it("returns null for a negative denominator", () => {
    expect(safeRate(5, -1)).toBeNull();
  });
});

describe("percentChange", () => {
  it("computes a normal percent change", () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it("returns null instead of Infinity when the previous period had zero", () => {
    expect(percentChange(10, 0)).toBeNull();
  });
});
