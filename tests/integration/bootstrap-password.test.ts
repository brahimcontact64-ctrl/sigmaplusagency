import { describe, it, expect } from "vitest";
import { resolveBootstrapPassword } from "@/lib/auth/bootstrap-password";

const SECRET = "correct-horse-battery-staple-42";

describe("resolveBootstrapPassword", () => {
  it("accepts ADMIN_BOOTSTRAP_PASSWORD regardless of environment", () => {
    const dev = resolveBootstrapPassword(undefined, { ADMIN_BOOTSTRAP_PASSWORD: SECRET, NODE_ENV: "development" });
    expect(dev).toEqual({ password: SECRET });

    const prod = resolveBootstrapPassword(undefined, { ADMIN_BOOTSTRAP_PASSWORD: SECRET, NODE_ENV: "production" });
    expect(prod).toEqual({ password: SECRET });
  });

  it("prefers ADMIN_BOOTSTRAP_PASSWORD over a --password= value when both are present", () => {
    const result = resolveBootstrapPassword("cli-value", { ADMIN_BOOTSTRAP_PASSWORD: SECRET, NODE_ENV: "development" });
    expect(result).toEqual({ password: SECRET });
  });

  it("still allows --password= in non-production when the env var is unset", () => {
    const result = resolveBootstrapPassword(SECRET, { NODE_ENV: "development" });
    expect(result).toEqual({ password: SECRET });

    const testEnvResult = resolveBootstrapPassword(SECRET, { NODE_ENV: "test" });
    expect(testEnvResult).toEqual({ password: SECRET });
  });

  it("rejects --password= in production when ADMIN_BOOTSTRAP_PASSWORD is unset", () => {
    const result = resolveBootstrapPassword(SECRET, { NODE_ENV: "production" });
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("ADMIN_BOOTSTRAP_PASSWORD");
    }
  });

  it("fails safely (an error result, never a throw) when no password is provided at all", () => {
    expect(() => resolveBootstrapPassword(undefined, { NODE_ENV: "development" })).not.toThrow();
    const result = resolveBootstrapPassword(undefined, { NODE_ENV: "development" });
    expect(result).toHaveProperty("error");

    const prodResult = resolveBootstrapPassword(undefined, { NODE_ENV: "production" });
    expect(prodResult).toHaveProperty("error");
  });

  it("never includes the actual (rejected) password value in the returned error", () => {
    const sensitiveValue = "this-should-never-leak-anywhere-xyz789";
    const result = resolveBootstrapPassword(sensitiveValue, { NODE_ENV: "production" });
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).not.toContain(sensitiveValue);
      expect(result.error).not.toContain("xyz789");
    }
  });

  it("returns a plain error string, never throws, across every branch", () => {
    const inputs: [string | undefined, { ADMIN_BOOTSTRAP_PASSWORD?: string; NODE_ENV?: string }][] = [
      [undefined, {}],
      [undefined, { NODE_ENV: "production" }],
      ["x", { NODE_ENV: "production" }],
      ["x", { NODE_ENV: "development" }],
      [undefined, { ADMIN_BOOTSTRAP_PASSWORD: "y" }],
    ];
    for (const [cli, env] of inputs) {
      expect(() => resolveBootstrapPassword(cli, env)).not.toThrow();
    }
  });
});
