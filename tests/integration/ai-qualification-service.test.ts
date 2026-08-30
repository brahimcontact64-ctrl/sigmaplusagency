import { describe, it, expect } from "vitest";
import { QualificationService } from "@/lib/services/ai-qualification-service";
import { EMPTY_QUALIFICATION_STATE } from "@/domain/ai-qualification";
import { FakeAIProvider, ThrowingAIProvider } from "./helpers/fake-ai-provider";

describe("QualificationService.extract", () => {
  it("parses a valid JSON extraction and merges it as INFERRED", async () => {
    const provider = new FakeAIProvider(['{"projectType":"ecommerce","goals":["sell-products"]}']);
    const service = new QualificationService(provider);

    const result = await service.extract({
      locale: "en",
      existingState: EMPTY_QUALIFICATION_STATE,
      transcript: [{ role: "user", content: "I want to sell products online" }],
      latestUserMessageId: "msg-1",
    });

    expect(result.projectType).toEqual({ value: "ecommerce", confidence: "INFERRED", sourceMessageId: "msg-1" });
    expect(result.goals?.value).toEqual(["sell-products"]);
  });

  it("tolerates prose wrapped around the JSON object", () => {
    const provider = new FakeAIProvider(['Sure, here is the extraction:\n{"projectType":"website"}\nHope this helps!']);
    const service = new QualificationService(provider);
    return service
      .extract({ locale: "en", existingState: EMPTY_QUALIFICATION_STATE, transcript: [], latestUserMessageId: "msg-1" })
      .then((result) => {
        expect(result.projectType?.value).toBe("website");
      });
  });

  it("rejects a canonical-ID value the model invented", async () => {
    const provider = new FakeAIProvider(['{"projectType":"not-a-real-type"}']);
    const service = new QualificationService(provider);

    const result = await service.extract({
      locale: "en",
      existingState: EMPTY_QUALIFICATION_STATE,
      transcript: [],
      latestUserMessageId: "msg-1",
    });

    expect(result.projectType).toBeUndefined();
  });

  it("returns the existing state unchanged on malformed JSON", async () => {
    const provider = new FakeAIProvider(["not json at all"]);
    const service = new QualificationService(provider);
    const existing = { ...EMPTY_QUALIFICATION_STATE, summary: "prior summary" };

    const result = await service.extract({ locale: "en", existingState: existing, transcript: [], latestUserMessageId: "msg-1" });
    expect(result).toEqual(existing);
  });

  it("returns the existing state unchanged when the provider throws", async () => {
    const provider = new ThrowingAIProvider();
    const service = new QualificationService(provider);
    const existing = { ...EMPTY_QUALIFICATION_STATE, summary: "prior summary" };

    const result = await service.extract({ locale: "en", existingState: existing, transcript: [], latestUserMessageId: "msg-1" });
    expect(result).toEqual(existing);
  });

  it("filters recommendedServices down to canonical service IDs only", async () => {
    const provider = new FakeAIProvider(['{"recommendedServices":["web-development","totally-made-up-service"]}']);
    const service = new QualificationService(provider);

    const result = await service.extract({
      locale: "en",
      existingState: EMPTY_QUALIFICATION_STATE,
      transcript: [],
      latestUserMessageId: "msg-1",
    });

    // Zod rejects the whole array if any element fails the enum — so an
    // invented service name drops the extraction pass's recommendation
    // entirely rather than silently keeping the valid one; this is the
    // conservative, safe failure mode (never surface an unverified guess).
    expect(result.recommendedServices).toEqual([]);
  });
});
