import { describe, it, expect } from "vitest";
import { selectAiModel, isSupportedModel, SUPPORTED_AI_MODELS, DEFAULT_AI_MODEL } from "@/lib/ai/model-config";

describe("selectAiModel", () => {
  it("resolves to the default when AI_MODEL is unset", () => {
    expect(selectAiModel(undefined)).toEqual({ ok: true, model: DEFAULT_AI_MODEL });
  });

  it("resolves to the default when AI_MODEL is empty/whitespace", () => {
    expect(selectAiModel("   ")).toEqual({ ok: true, model: DEFAULT_AI_MODEL });
  });

  it("accepts every explicitly supported model", () => {
    for (const model of SUPPORTED_AI_MODELS) {
      expect(selectAiModel(model)).toEqual({ ok: true, model });
    }
  });

  it("trims surrounding whitespace on a valid model", () => {
    expect(selectAiModel(`  ${SUPPORTED_AI_MODELS[0]}  `)).toEqual({ ok: true, model: SUPPORTED_AI_MODELS[0] });
  });

  it("rejects an unsupported/speculative model name rather than passing it through", () => {
    const result = selectAiModel("gpt-5-turbo-max");
    expect(result).toEqual({ ok: false, requested: "gpt-5-turbo-max" });
  });

  it("rejects a plausible-looking but non-existent Claude model id", () => {
    const result = selectAiModel("claude-4-opus-preview");
    expect(result.ok).toBe(false);
  });
});

describe("isSupportedModel", () => {
  it("agrees with the allowlist both ways", () => {
    expect(isSupportedModel("claude-sonnet-5")).toBe(true);
    expect(isSupportedModel("made-up-model")).toBe(false);
  });
});
