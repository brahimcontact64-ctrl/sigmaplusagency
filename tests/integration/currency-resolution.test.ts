import { describe, it, expect } from "vitest";
import { defaultCurrencyForCountry } from "@/lib/pricing/country-currency";
import { resolveCurrencyFromSignals } from "@/lib/pricing/resolve-currency";

describe("defaultCurrencyForCountry", () => {
  it("maps Algeria to DZD", () => {
    expect(defaultCurrencyForCountry("DZ")).toBe("DZD");
    expect(defaultCurrencyForCountry("dz")).toBe("DZD"); // case-insensitive
  });

  it("defaults to EUR for any other country", () => {
    expect(defaultCurrencyForCountry("FR")).toBe("EUR");
    expect(defaultCurrencyForCountry("US")).toBe("EUR");
    expect(defaultCurrencyForCountry("BE")).toBe("EUR"); // French-speaking, not Algeria — must not be inferred from language
  });

  it("defaults to EUR when no country is known", () => {
    expect(defaultCurrencyForCountry(undefined)).toBe("EUR");
    expect(defaultCurrencyForCountry(null)).toBe("EUR");
    expect(defaultCurrencyForCountry("")).toBe("EUR");
  });
});

describe("resolveCurrencyFromSignals — priority order (Phase 11 §5)", () => {
  it("1. an explicit override always wins, even over a conflicting geo signal", () => {
    const result = resolveCurrencyFromSignals({ storedCurrency: "DZD", isOverride: true, geoCountry: "FR" });
    expect(result).toBe("DZD");
  });

  it("an override with an unsupported stored value falls through instead of crashing", () => {
    const result = resolveCurrencyFromSignals({ storedCurrency: "XYZ", isOverride: true, geoCountry: "DZ" });
    expect(result).toBe("DZD"); // falls through to the geo signal, tier 2
  });

  it("2. a fresh geo signal wins over a stale persisted (non-override) value", () => {
    const result = resolveCurrencyFromSignals({ storedCurrency: "EUR", isOverride: false, geoCountry: "DZ" });
    expect(result).toBe("DZD");
  });

  it("3. falls back to the persisted value when no geo signal is available", () => {
    const result = resolveCurrencyFromSignals({ storedCurrency: "DZD", isOverride: false, geoCountry: undefined });
    expect(result).toBe("DZD");
  });

  it("4. falls back to EUR when nothing is known at all", () => {
    const result = resolveCurrencyFromSignals({ isOverride: false });
    expect(result).toBe("EUR");
  });

  it("never infers currency from anything other than override/geo/persisted signals", () => {
    // No language/locale field even exists on the signals type — this
    // test exists to make that omission a deliberate, checked contract.
    const result = resolveCurrencyFromSignals({ isOverride: false, geoCountry: null });
    expect(result).toBe("EUR");
  });
});
