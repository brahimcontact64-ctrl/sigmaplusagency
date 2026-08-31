import { describe, it, expect } from "vitest";
import { ENV_VARS, getMissingRequiredProductionVars, buildEnvPresenceReport } from "@/lib/env";

describe("ENV_VARS", () => {
  it("never exposes a variable's value, only metadata", () => {
    for (const entry of ENV_VARS) {
      expect(Object.keys(entry).sort()).toEqual(["category", "description", "name"]);
    }
  });
});

describe("buildEnvPresenceReport", () => {
  it("reports presence without leaking values", () => {
    const report = buildEnvPresenceReport();
    expect(report.length).toBe(ENV_VARS.length);
    for (const row of report) {
      expect(typeof row.present).toBe("boolean");
    }
  });
});

describe("getMissingRequiredProductionVars", () => {
  it("flags DATABASE_URL as missing when unset", () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      expect(getMissingRequiredProductionVars()).toContain("DATABASE_URL");
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
    }
  });

  it("does not flag a var once it's set", () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://example";
    try {
      expect(getMissingRequiredProductionVars()).not.toContain("DATABASE_URL");
    } finally {
      if (original === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = original;
    }
  });
});
