import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { forwardLeadToMagicFlux, isMagicFluxConfigured } from "@/lib/integrations/magicflux";
import { buildMagicFluxPayload } from "@/domain/project-inquiry";

const SECRET = "super-secret-per-workflow-token";
const URL = "https://magicflux.example.com/api/workflows/wf_123/webhook";

function samplePayload() {
  return buildMagicFluxPayload({
    name: "Amine Test",
    email: "amine@example.com",
    phone: "+213550000000",
    service: "ecommerce",
    projectDescription: "An online store for my brand.",
    budgetRangeId: "5000-15000",
    budgetMin: 5000,
    budgetMax: 15000,
    budgetCurrency: "EUR",
    urgency: "urgent",
    purchaseIntent: "ready-to-start",
    desiredStart: "asap",
    locale: "en",
    reference: "SP-ABC123",
    submittedAt: "2026-09-15T00:00:00.000Z",
  });
}

describe("MagicFlux bridge — the secure server-side webhook forward (never called from the browser)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is reported unconfigured when neither env var is set", () => {
    vi.stubEnv("MAGICFLUX_WEBHOOK_URL", "");
    vi.stubEnv("MAGICFLUX_WEBHOOK_SECRET", "");
    expect(isMagicFluxConfigured()).toBe(false);
  });

  it("SKIPPED (not an error) when unconfigured — never blocks the lead it's attached to", async () => {
    vi.stubEnv("MAGICFLUX_WEBHOOK_URL", "");
    vi.stubEnv("MAGICFLUX_WEBHOOK_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await forwardLeadToMagicFlux(samplePayload(), "nonce-1");
    expect(result.outcome).toBe("SKIPPED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("when configured", () => {
    beforeEach(() => {
      vi.stubEnv("MAGICFLUX_WEBHOOK_URL", URL);
      vi.stubEnv("MAGICFLUX_WEBHOOK_SECRET", SECRET);
    });

    it("sends the real, verified auth contract: X-MagicFlux-Webhook-Secret static header, plus an Idempotency-Key", async () => {
      let capturedUrl: string | undefined;
      let capturedInit: RequestInit | undefined;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init: RequestInit) => {
          capturedUrl = url;
          capturedInit = init;
          return new Response(JSON.stringify({ executionId: "exec_abc" }), { status: 202 });
        }),
      );

      const result = await forwardLeadToMagicFlux(samplePayload(), "nonce-42");

      expect(capturedUrl).toBe(URL);
      const headers = capturedInit!.headers as Record<string, string>;
      expect(headers["X-MagicFlux-Webhook-Secret"]).toBe(SECRET);
      expect(headers["Idempotency-Key"]).toBe("nonce-42");
      expect(headers["Content-Type"]).toBe("application/json");

      expect(result.outcome).toBe("SENT");
      expect(result.executionId).toBe("exec_abc");
    });

    it("sends the exact payload as the JSON body, unchanged", async () => {
      let capturedBody: string | undefined;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init: RequestInit) => {
          capturedBody = init.body as string;
          return new Response(JSON.stringify({}), { status: 200 });
        }),
      );

      const payload = samplePayload();
      await forwardLeadToMagicFlux(payload, "nonce-1");
      expect(JSON.parse(capturedBody!)).toEqual(payload);
    });

    it("reports FAILED (not thrown) on a non-2xx response, without leaking the response body", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => new Response("secret internal details", { status: 401 })));
      const result = await forwardLeadToMagicFlux(samplePayload(), "nonce-1");
      expect(result.outcome).toBe("FAILED");
      expect(result.errorReason).toBe("http_401");
      expect(JSON.stringify(result)).not.toContain("secret internal details");
    });

    it("reports FAILED (not thrown) on a network error", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
      const result = await forwardLeadToMagicFlux(samplePayload(), "nonce-1");
      expect(result.outcome).toBe("FAILED");
      expect(result.errorReason).toBe("network_error");
    });

    it("never logs the webhook secret, even when the request fails", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom"); }));
      await forwardLeadToMagicFlux(samplePayload(), "nonce-1");

      const loggedText = errorSpy.mock.calls.flat().map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(" ");
      expect(loggedText).not.toContain(SECRET);
    });

    it("never logs the raw response body on failure", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn(async () => new Response("leaked-body-marker", { status: 500 })));
      await forwardLeadToMagicFlux(samplePayload(), "nonce-1");

      const loggedText = errorSpy.mock.calls.flat().map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(" ");
      expect(loggedText).not.toContain("leaked-body-marker");
    });
  });
});
