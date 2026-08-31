/**
 * Pure model-selection logic, deliberately free of `process.env` reads
 * and `server-only` — split out purely so it's unit-testable in Vitest
 * (see the `server-only`-isn't-installed gotcha: any file that imports
 * it, even transitively, can't be loaded by Vitest at all). get-provider.ts
 * is the actual env-reading, server-only wrapper around this.
 */
export const SUPPORTED_AI_MODELS = ["claude-sonnet-5", "claude-opus-5", "claude-fable-5", "claude-haiku-4-5-20251001"] as const;
export type SupportedAiModel = (typeof SUPPORTED_AI_MODELS)[number];

export const DEFAULT_AI_MODEL: SupportedAiModel = "claude-sonnet-5";

export function isSupportedModel(value: string): value is SupportedAiModel {
  return (SUPPORTED_AI_MODELS as readonly string[]).includes(value);
}

export type ModelSelection = { ok: true; model: SupportedAiModel } | { ok: false; requested: string };

/** `requested` is whatever AI_MODEL happens to be (untrimmed/empty allowed) — empty/unset resolves to the default rather than being treated as invalid. */
export function selectAiModel(requested: string | undefined): ModelSelection {
  const trimmed = requested?.trim();
  if (!trimmed) return { ok: true, model: DEFAULT_AI_MODEL };
  if (isSupportedModel(trimmed)) return { ok: true, model: trimmed };
  return { ok: false, requested: trimmed };
}
