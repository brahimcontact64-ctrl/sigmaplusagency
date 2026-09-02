import { describe, it, expect, afterEach, vi, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";

let db: AppDatabase;

vi.mock("@/lib/repositories/seo-connection-repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories/seo-connection-repository")>("@/lib/repositories/seo-connection-repository");
  return { ...actual, getSeoConnectionRepository: () => actual.createTestSeoConnectionRepository(async () => db) };
});

beforeAll(async () => {
  db = await createTestDb();
});

describe("getKeywordProvider — Phase 12 §7, no vendor implemented", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is never configured, regardless of env vars — no real vendor exists yet", async () => {
    vi.stubEnv("SERP_PROVIDER", "SOME_VENDOR");
    vi.stubEnv("SERP_API_KEY", "fake-key");
    const { getKeywordProvider } = await import("@/lib/seo/providers/keyword-provider");
    expect(getKeywordProvider().isConfigured()).toBe(false);
    expect(getKeywordProvider().providerId()).toBe("NONE");
  });

  it("checkPositions() always returns an empty array — never a fabricated position", async () => {
    const { getKeywordProvider } = await import("@/lib/seo/providers/keyword-provider");
    const results = await getKeywordProvider().checkPositions([{ keyword: "test", country: "DZ", language: "fr" }]);
    expect(results).toEqual([]);
  });

  it("reports NOT_CONFIGURED when SERP_PROVIDER is unset", async () => {
    vi.stubEnv("SERP_PROVIDER", "");
    vi.stubEnv("SERP_API_KEY", "");
    const { getKeywordProviderConnection } = await import("@/lib/seo/providers/keyword-provider");
    const state = await getKeywordProviderConnection();
    expect(state.status).toBe("NOT_CONFIGURED");
  });

  it("reports an honest ERROR (never CONNECTED) when a provider is named but no client is implemented", async () => {
    vi.stubEnv("SERP_PROVIDER", "SOME_VENDOR");
    vi.stubEnv("SERP_API_KEY", "fake-key");
    const { getKeywordProviderConnection } = await import("@/lib/seo/providers/keyword-provider");
    const state = await getKeywordProviderConnection();
    expect(state.status).toBe("ERROR");
    expect(state.status).not.toBe("CONNECTED");
  });
});
