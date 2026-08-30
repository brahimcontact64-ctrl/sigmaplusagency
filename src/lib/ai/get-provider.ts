import "server-only";
import { AnthropicProvider } from "./anthropic-provider";
import type { AIProvider } from "./provider";

const DEFAULT_MODEL = "claude-sonnet-5";

let cached: { provider: AIProvider; apiKey: string; model: string } | null = null;

/**
 * Returns `null` when no API key is configured — this is the single
 * source of truth for "AI unavailable" (see master plan Phase 6 "no
 * API key fallback"). Every caller (the chat route, the AI consultant
 * page) checks this before doing anything else, so the rest of the
 * site never depends on it. Model is server-configured only
 * (`AI_MODEL`) — a client request can never select or override it.
 */
export function getAIProvider(): AIProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;

  if (cached && cached.apiKey === apiKey && cached.model === model) {
    return cached.provider;
  }

  const provider = new AnthropicProvider(apiKey, model);
  cached = { provider, apiKey, model };
  return provider;
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
