import { describe, it, expect } from "vitest";
import { aiChatRequestSchema } from "@/domain/ai-chat";
import { AI_LIMITS } from "@/domain/ai-conversation";
import { aiMessageSessionRateLimiter, aiMessageIpRateLimiter } from "@/lib/security/rate-limit";

const validSessionId = "11111111-1111-4111-8111-111111111111";

describe("aiChatRequestSchema", () => {
  it("accepts a well-formed request", () => {
    const result = aiChatRequestSchema.safeParse({ sessionId: validSessionId, locale: "en", message: "Hello" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID sessionId", () => {
    const result = aiChatRequestSchema.safeParse({ sessionId: "not-a-uuid", locale: "en", message: "Hello" });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported locale", () => {
    const result = aiChatRequestSchema.safeParse({ sessionId: validSessionId, locale: "es", message: "Hello" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = aiChatRequestSchema.safeParse({ sessionId: validSessionId, locale: "en", message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a message over the configured length limit", () => {
    const result = aiChatRequestSchema.safeParse({
      sessionId: validSessionId,
      locale: "en",
      message: "x".repeat(AI_LIMITS.maxMessageLength + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unexpected extra fields (strict mode) — a client can never smuggle in e.g. a model override", () => {
    const result = aiChatRequestSchema.safeParse({
      sessionId: validSessionId,
      locale: "en",
      message: "Hello",
      model: "some-other-model",
    });
    expect(result.success).toBe(false);
  });
});

describe("AI rate limiters", () => {
  it("session limiter blocks after its configured threshold", async () => {
    const key = "test-session-unique-key-1";
    let allowed = true;
    for (let i = 0; i < 25; i++) {
      allowed = await aiMessageSessionRateLimiter.check(key);
    }
    expect(allowed).toBe(false);
  });

  it("IP limiter is independent per key", async () => {
    expect(await aiMessageIpRateLimiter.check("test-ip-unique-key-1")).toBe(true);
    expect(await aiMessageIpRateLimiter.check("test-ip-unique-key-2")).toBe(true);
  });
});
