import type { QualificationState } from "./ai-qualification";

export const AI_MESSAGE_ROLES = ["user", "assistant"] as const;
export type AiMessageRole = (typeof AI_MESSAGE_ROLES)[number];

export const AI_CONVERSATION_STATUSES = ["active", "expired", "converted"] as const;
export type AiConversationStatus = (typeof AI_CONVERSATION_STATUSES)[number];

export type AiMessage = {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  createdAt: Date;
};

export type AiConversation = {
  id: string;
  sessionId: string;
  locale: string;
  leadId?: string;
  projectRequestId?: string;
  status: AiConversationStatus;
  qualificationState: QualificationState;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Cost/abuse controls (master plan Phase 6 §29-32) — server-enforced,
 * never dependent on the UI honoring them.
 */
export const AI_LIMITS = {
  /** Longer than this and we reject the message outright before it ever reaches the model. */
  maxMessageLength: 2000,
  /** Total user+assistant messages a single conversation may accumulate before requiring a fresh one. */
  maxConversationMessages: 60,
  /** A conversation untouched this long is treated as expired — resuming starts a new one. */
  conversationExpiryMs: 24 * 60 * 60 * 1000,
  /** Upper bound on a single assistant reply, enforced provider-side via max_tokens. */
  maxOutputTokens: 700,
  /** How many of the most recent messages are sent to the model each turn — see summary for how older context is preserved cheaply instead. */
  recentTurnsForPrompt: 16,
  /** Re-summarize after this many new messages since the last summary. */
  summarizeEveryNMessages: 12,
} as const;

export function isConversationExpired(conversation: Pick<AiConversation, "updatedAt">): boolean {
  return Date.now() - conversation.updatedAt.getTime() > AI_LIMITS.conversationExpiryMs;
}
