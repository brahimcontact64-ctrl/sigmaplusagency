import "server-only";
import { AnthropicProvider } from "./anthropic-provider";
import type { AIProvider } from "./provider";
import { selectAiModel, SUPPORTED_AI_MODELS, type SupportedAiModel } from "./model-config";

export type AiConfigResolution =
  | { ok: true; apiKey: string; model: SupportedAiModel }
  | { ok: false; reason: "no_api_key" | "unsupported_model" };

/**
 * The one place AI configuration is actually read. `AI_MODEL` is
 * server-only env config — never accepted from a client request — and
 * is validated against SUPPORTED_AI_MODELS (see model-config.ts)
 * rather than passed through blindly: a typo'd or retired model ID is
 * treated exactly like "no API key" (the same already-tested, honest
 * "AI unavailable" state) instead of only surfacing as an opaque
 * provider error the first time a visitor actually sends a message.
 */
export function resolveAiConfig(): AiConfigResolution {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, reason: "no_api_key" };

  const selection = selectAiModel(process.env.AI_MODEL);
  if (!selection.ok) {
    console.error(
      `[ai] AI_MODEL="${selection.requested}" is not one of the models this deployment explicitly supports ` +
        `(${SUPPORTED_AI_MODELS.join(", ")}). Treating AI as unavailable rather than risking undefined ` +
        `provider behavior — fix AI_MODEL or unset it to use the default.`,
    );
    return { ok: false, reason: "unsupported_model" };
  }

  return { ok: true, apiKey, model: selection.model };
}

let cached: { provider: AIProvider; apiKey: string; model: string } | null = null;

/**
 * Returns `null` when AI is unavailable for any reason (no key, or a
 * misconfigured model) — the single source of truth for "AI
 * unavailable" (see master plan Phase 6 "no API key fallback"). Every
 * caller (the chat route, the AI consultant page) checks this before
 * doing anything else, so the rest of the site never depends on it.
 */
export function getAIProvider(): AIProvider | null {
  const config = resolveAiConfig();
  if (!config.ok) return null;

  if (cached && cached.apiKey === config.apiKey && cached.model === config.model) {
    return cached.provider;
  }

  const provider = new AnthropicProvider(config.apiKey, config.model);
  cached = { provider, apiKey: config.apiKey, model: config.model };
  return provider;
}

export function isAIConfigured(): boolean {
  return resolveAiConfig().ok;
}
