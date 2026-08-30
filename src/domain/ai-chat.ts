import { z } from "zod";
import { locales } from "@/i18n/routing";
import { AI_LIMITS } from "./ai-conversation";

export const aiChatRequestSchema = z
  .object({
    sessionId: z.uuid(),
    conversationId: z.uuid().optional(),
    locale: z.enum(locales),
    message: z.string().trim().min(1).max(AI_LIMITS.maxMessageLength),
  })
  .strict();

export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;

export const AI_CHAT_ERRORS = [
  "invalid_request",
  "rate_limited",
  "message_too_long",
  "conversation_limit_reached",
  "conversation_expired",
  "ai_unavailable",
  "not_found",
  "unexpected",
] as const;
export type AiChatError = (typeof AI_CHAT_ERRORS)[number];
