import type { Locale } from "@/i18n/routing";
import type { AIProvider, ChatMessage } from "@/lib/ai/provider";
import { buildConsultantSystemPrompt } from "@/lib/ai/system-prompt";
import { getAiConversationRepository, type AiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { AI_LIMITS } from "@/domain/ai-conversation";
import type { AiMessage } from "@/domain/ai-conversation";

const SUMMARY_MAX_TOKENS = 300;

/**
 * Owns the conversational turn: builds a cost-bounded prompt (recent
 * turns + a rolling summary instead of the full transcript — see
 * AI_LIMITS.recentTurnsForPrompt/summarizeEveryNMessages) and streams
 * the reply. Qualification extraction is a separate concern
 * (QualificationService) so a failure in one can never take down the
 * other, and so each is independently unit-testable.
 */
export class AIConversationService {
  constructor(
    private readonly provider: AIProvider,
    private readonly repo: AiConversationRepository = getAiConversationRepository(),
  ) {}

  /** Messages to send the model this turn: an optional summary line standing in for older history, plus the most recent real turns. */
  buildPromptMessages(history: AiMessage[], summary: string | undefined): ChatMessage[] {
    const recent = history.slice(-AI_LIMITS.recentTurnsForPrompt);
    const messages: ChatMessage[] = recent.map((m) => ({ role: m.role, content: m.content }));

    if (summary && history.length > AI_LIMITS.recentTurnsForPrompt) {
      messages.unshift({
        role: "user",
        content: `[Context from earlier in this conversation, summarized: ${summary}]`,
      });
    }

    return messages;
  }

  streamReply(locale: Locale, promptMessages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    return this.provider.streamReply({
      system: buildConsultantSystemPrompt(locale),
      messages: promptMessages,
      maxTokens: AI_LIMITS.maxOutputTokens,
      signal,
    });
  }

  /** Called after every assistant turn; only actually calls the model every summarizeEveryNMessages turns, to keep this cheap. */
  async maybeUpdateSummary(conversationId: string, history: AiMessage[], existingSummary: string | undefined): Promise<void> {
    if (history.length === 0 || history.length % AI_LIMITS.summarizeEveryNMessages !== 0) return;
    if (history.length <= AI_LIMITS.recentTurnsForPrompt) return;

    const olderMessages = history.slice(0, -AI_LIMITS.recentTurnsForPrompt);
    if (olderMessages.length === 0) return;

    try {
      const summary = await this.provider.complete({
        system:
          "Summarize the following sales-qualification conversation in 3-4 short sentences: what the client wants, key context, anything already decided. Plain text only, no headers.",
        messages: [
          ...(existingSummary ? [{ role: "user" as const, content: `Previous summary: ${existingSummary}` }] : []),
          ...olderMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
        maxTokens: SUMMARY_MAX_TOKENS,
      });
      if (summary.trim()) await this.repo.updateSummary(conversationId, summary.trim());
    } catch (error) {
      // Non-critical — the conversation still works without an updated summary, it just costs a bit more on the next turn.
      console.error("[ai-conversation] summary update failed:", error);
    }
  }
}
