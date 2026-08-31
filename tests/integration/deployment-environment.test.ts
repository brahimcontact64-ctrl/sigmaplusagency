import { describe, it, expect, vi, afterEach } from "vitest";
import { getDeploymentEnvironment, isProductionDeployment } from "@/lib/deployment";

describe("getDeploymentEnvironment / isProductionDeployment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("trusts VERCEL_ENV=production even when NODE_ENV is also production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(getDeploymentEnvironment()).toBe("production");
    expect(isProductionDeployment()).toBe(true);
  });

  it("never treats a preview build as production, even though NODE_ENV=production during a preview build", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
    expect(getDeploymentEnvironment()).toBe("preview");
    expect(isProductionDeployment()).toBe(false);
  });

  it("falls back to NODE_ENV when VERCEL_ENV is unset", () => {
    delete process.env.VERCEL_ENV;
    vi.stubEnv("NODE_ENV", "production");
    expect(getDeploymentEnvironment()).toBe("production");
    expect(isProductionDeployment()).toBe(true);
  });

  it("treats a non-production NODE_ENV as development", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(getDeploymentEnvironment()).toBe("development");
    expect(isProductionDeployment()).toBe(false);
  });
});
