import { z } from "zod";
import type { Locale } from "@/i18n/routing";
import type { AIProvider, ChatMessage } from "@/lib/ai/provider";
import { buildExtractionSystemPrompt } from "@/lib/ai/system-prompt";
import {
  PROJECT_TYPES,
  PROJECT_GOALS,
  PROJECT_CAPABILITIES,
  PROJECT_PLATFORMS,
  BUSINESS_STATES,
  PROJECT_TIMELINES,
} from "@/domain/project-request";
import { PREFERRED_CONTACT_METHODS } from "@/domain/lead";
import { SERVICE_IDS } from "@/domain/service";
import { BUDGET_RANGE_IDS } from "@/config/budget-ranges";
import { mergeInferredQualification, type ExtractedFieldValues, type QualificationState } from "@/domain/ai-qualification";

const extractionSchema = z.object({
  projectType: z.enum(PROJECT_TYPES).optional(),
  goals: z.array(z.enum(PROJECT_GOALS)).max(10).optional(),
  capabilities: z.array(z.enum(PROJECT_CAPABILITIES)).max(15).optional(),
  platforms: z.array(z.enum(PROJECT_PLATFORMS)).max(6).optional(),
  businessState: z.enum(BUSINESS_STATES).optional(),
  businessName: z.string().trim().min(1).max(200).optional(),
  existingWebsite: z.string().trim().min(1).max(300).optional(),
  existingTools: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
  timeline: z.enum(PROJECT_TIMELINES).optional(),
  budgetRange: z
    .string()
    .refine((v) => (BUDGET_RANGE_IDS as string[]).includes(v))
    .optional(),
  country: z.string().trim().min(1).max(100).optional(),
  preferredContactMethod: z.enum(PREFERRED_CONTACT_METHODS).optional(),
  openQuestions: z.array(z.string().trim().min(1).max(300)).max(6).optional(),
  recommendedServices: z.array(z.enum(SERVICE_IDS)).max(6).optional(),
});

const MAX_EXTRACTION_TOKENS = 500;

/**
 * Runs independently of the conversational reply — a separate,
 * non-streamed, JSON-only call so a parse failure here can never break
 * the visible chat. On any failure (provider error, malformed JSON,
 * schema mismatch) this returns the qualification state unchanged
 * rather than guessing or throwing.
 */
export class QualificationService {
  constructor(private readonly provider: AIProvider) {}

  async extract(params: {
    locale: Locale;
    existingState: QualificationState;
    transcript: ChatMessage[];
    latestUserMessageId: string;
  }): Promise<QualificationState> {
    const { locale, existingState, transcript, latestUserMessageId } = params;

    let raw: string;
    try {
      raw = await this.provider.complete({
        system: buildExtractionSystemPrompt(locale),
        messages: [
          ...transcript,
          {
            role: "user",
            content:
              "Extract the current qualification JSON from the conversation above. Respond with JSON only.",
          },
        ],
        maxTokens: MAX_EXTRACTION_TOKENS,
      });
    } catch (error) {
      console.error("[ai-qualification] extraction call failed:", error);
      return existingState;
    }

    const jsonText = extractJsonObject(raw);
    if (!jsonText) return existingState;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      return existingState;
    }

    const result = extractionSchema.safeParse(parsedJson);
    if (!result.success) return existingState;

    const { openQuestions, recommendedServices, ...fieldValues } = result.data;

    return mergeInferredQualification(existingState, fieldValues as ExtractedFieldValues, latestUserMessageId, {
      openQuestions,
      recommendedServices,
    });
  }
}

/** Models occasionally wrap JSON in prose or a markdown fence despite instructions — pull out the first {...} block rather than failing outright. */
function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
