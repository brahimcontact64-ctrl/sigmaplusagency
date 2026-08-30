export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AICompletionParams = {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
};

export type AIStreamParams = AICompletionParams & { signal?: AbortSignal };

/**
 * The only interface the rest of the app depends on — no code outside
 * this `src/lib/ai/` directory ever imports the Anthropic SDK directly.
 * A second provider later means implementing this interface once, not
 * touching AIConversationService/QualificationService/the route handler.
 */
export interface AIProvider {
  streamReply(params: AIStreamParams): AsyncIterable<string>;
  complete(params: AICompletionParams): Promise<string>;
}
