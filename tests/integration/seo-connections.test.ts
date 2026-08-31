import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestSeoConnectionRepository } from "@/lib/repositories/seo-connection-repository";

let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("SeoConnectionRepository", () => {
  it("upserts idempotently — a second sync attempt updates the same row rather than duplicating it", async () => {
    const repo = createTestSeoConnectionRepository(async () => db);

    await repo.upsert("PAGESPEED", { status: "NOT_CONFIGURED" });
    await repo.upsert("PAGESPEED", { status: "ERROR", lastError: "boom" });

    const all = await repo.listAll();
    expect(all.filter((c) => c.provider === "PAGESPEED")).toHaveLength(1);

    const state = await repo.get("PAGESPEED");
    expect(state?.status).toBe("ERROR");
    expect(state?.lastError).toBe("boom");
  });

  it("preserves the last error when a later sync succeeds and clears it", async () => {
    const repo = createTestSeoConnectionRepository(async () => db);
    await repo.upsert("GOOGLE_ANALYTICS", { status: "ERROR", lastError: "quota exceeded" });
    await repo.upsert("GOOGLE_ANALYTICS", { status: "NOT_CONFIGURED", lastError: undefined });

    const state = await repo.get("GOOGLE_ANALYTICS");
    expect(state?.status).toBe("NOT_CONFIGURED");
  });

  it("returns null for a provider that's never been synced", async () => {
    const repo = createTestSeoConnectionRepository(async () => db);
    expect(await repo.get("GOOGLE_SEARCH_CONSOLE")).toBeNull();
  });
});

describe("External SEO adapters — disconnected-by-default state", () => {
  it("search console reports NOT_CONFIGURED with no credentials", async () => {
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_SITE_URL", "");
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON", "");
    const { getSearchConsoleConnection } = await import("@/lib/seo/adapters/search-console");
    const state = await getSearchConsoleConnection();
    expect(state.status).toBe("NOT_CONFIGURED");
  });

  it("a sync call never fabricates page/query metrics while disconnected", async () => {
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_SITE_URL", "");
    vi.stubEnv("GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON", "");
    const { syncSearchConsole } = await import("@/lib/seo/adapters/search-console");
    const result = await syncSearchConsole();
    expect(result.pageMetrics).toEqual([]);
    expect(result.queryMetrics).toEqual([]);
  });

  it("pagespeed reports NOT_CONFIGURED with no API key", async () => {
    vi.stubEnv("PAGESPEED_API_KEY", "");
    const { getPageSpeedConnection } = await import("@/lib/seo/adapters/pagespeed");
    const state = await getPageSpeedConnection();
    expect(state.status).toBe("NOT_CONFIGURED");
  });
});
