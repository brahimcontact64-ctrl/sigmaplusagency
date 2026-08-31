import { describe, it, expect, vi, afterEach } from "vitest";
import { log } from "@/lib/observability/logger";
import { reportError } from "@/lib/observability/error-reporter";

describe("log", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts a secret-shaped key regardless of casing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log({ level: "ERROR", event: "test", component: "test", password: "hunter2", apiKey: "sk-real-key", safeField: "ok" });

    const payload = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(payload.password).toBe("[redacted]");
    expect(payload.apiKey).toBe("[redacted]");
    expect(payload.safeField).toBe("ok");
  });

  it("writes valid JSON with a timestamp and the given level", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    log({ level: "INFO", event: "test_event", component: "test-component" });

    const payload = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(payload.level).toBe("INFO");
    expect(payload.event).toBe("test_event");
    expect(typeof payload.timestamp).toBe("string");
  });

  it("dispatches to the console method matching the level", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    log({ level: "WARN", event: "test", component: "test" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("reportError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a correlation id and never leaks the raw error message into the id itself", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const id = reportError(new Error("some internal detail"), { component: "test" });
    expect(typeof id).toBe("string");
    expect(id).not.toContain("internal detail");
  });

  it("logs an ERROR-level entry with a stable errorCode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    reportError(new Error("boom"), { component: "test", errorCode: "AI_PROVIDER_UNAVAILABLE" });
    const payload = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(payload.errorCode).toBe("AI_PROVIDER_UNAVAILABLE");
    expect(payload.level).toBe("ERROR");
  });
});
