import { describe, it, expect } from "vitest";
import { isSupportedCurrency, toMinorUnits, fromMinorUnits, formatMoney } from "@/lib/money";

describe("isSupportedCurrency", () => {
  it("accepts a known currency code", () => {
    expect(isSupportedCurrency("EUR")).toBe(true);
  });

  it("rejects an unsupported/garbage value", () => {
    expect(isSupportedCurrency("BTC")).toBe(false);
    expect(isSupportedCurrency(123)).toBe(false);
    expect(isSupportedCurrency(undefined)).toBe(false);
  });
});

describe("toMinorUnits / fromMinorUnits", () => {
  it("round-trips a normal amount exactly", () => {
    expect(toMinorUnits(1500.5)).toBe(150050);
    expect(fromMinorUnits(150050)).toBe(1500.5);
  });

  it("rounds to the nearest minor unit rather than truncating", () => {
    expect(toMinorUnits(10.005)).toBe(1001); // 10.005 * 100 = 1000.5 -> rounds to 1001
  });

  it("throws on a negative amount rather than silently storing it", () => {
    expect(() => toMinorUnits(-1)).toThrow(RangeError);
  });

  it("throws on a non-finite amount", () => {
    expect(() => toMinorUnits(Number.NaN)).toThrow(RangeError);
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("accepts zero", () => {
    expect(toMinorUnits(0)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats minor units as a currency string", () => {
    expect(formatMoney(150000, "EUR", "en-US")).toBe("€1,500.00");
  });
});
