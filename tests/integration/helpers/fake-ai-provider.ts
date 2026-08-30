import type { AIProvider, AICompletionParams, AIStreamParams } from "@/lib/ai/provider";

/**
 * Deterministic test double for AIProvider — every service that talks
 * to "the model" depends on this interface, never the real Anthropic
 * SDK, so tests never make a network call and never need an API key.
 */
export class FakeAIProvider implements AIProvider {
  public completeCalls: AICompletionParams[] = [];
  public streamCalls: AIStreamParams[] = [];

  constructor(
    private readonly completeResponses: string[] = [],
    private readonly streamChunks: string[] = ["Hello", " there!"],
  ) {}

  async *streamReply(params: AIStreamParams): AsyncIterable<string> {
    this.streamCalls.push(params);
    for (const chunk of this.streamChunks) {
      yield chunk;
    }
  }

  async complete(params: AICompletionParams): Promise<string> {
    this.completeCalls.push(params);
    const response = this.completeResponses[this.completeCalls.length - 1];
    return response ?? "{}";
  }
}

export class ThrowingAIProvider implements AIProvider {
  async *streamReply(): AsyncIterable<string> {
    throw new Error("provider unavailable");
  }
  async complete(): Promise<string> {
    throw new Error("provider unavailable");
  }
}
