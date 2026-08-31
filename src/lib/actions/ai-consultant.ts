"use server";

import { aiLeadCaptureSchema } from "@/domain/ai-lead-capture";
import { hasMinimalQualification } from "@/domain/ai-qualification";
import { getAiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { getLeadRepository } from "@/lib/repositories/lead-repository";
import { submitProjectRequest } from "@/lib/services/lead-service";
import { qualificationToSubmitInput } from "@/lib/ai/qualification-to-project-request";
import { buildProjectRequestWhatsAppUrl } from "@/lib/services/whatsapp-summary";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { submissionRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";
import { z } from "zod";

export type RequestAiProposalResult =
  | { success: true; reference: string; whatsappUrl: string }
  | { success: false; error: "validation_error" | "rate_limited" | "not_found" | "db_unavailable" | "maintenance" | "unexpected" };

/**
 * The one place an AI conversation can turn into a real CRM lead —
 * only reached when the visitor explicitly asks for a proposal/contact
 * and provides their details, never automatically. Goes through the
 * exact same submitProjectRequest() used by the guided Project
 * Builder — no separate/bypassing write path into leads or
 * project_requests. See master plan Phase 6 "AI → Lead" for why a
 * conversation alone never creates CRM data.
 */
export async function requestAiProposalAction(input: unknown): Promise<RequestAiProposalResult> {
  if (isMaintenanceModeEnabled()) {
    return { success: false, error: "maintenance" };
  }

  const parsed = aiLeadCaptureSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "validation_error" };
  const data = parsed.data;

  const ip = await getClientIp();
  if (!(await submissionRateLimiter.check(`ai-proposal:${ip}`))) {
    return { success: false, error: "rate_limited" };
  }

  const conversationRepo = getAiConversationRepository();
  const conversation = await conversationRepo.findByIdForSession(data.conversationId, data.sessionId);
  if (!conversation) return { success: false, error: "not_found" };

  const submitInput = qualificationToSubmitInput(
    conversation.qualificationState,
    { name: data.name, email: data.email, phone: data.phone || undefined, company: data.company || undefined, country: data.country || undefined },
    data.locale,
    {
      landingPage: data.landingPage || undefined,
      referrer: data.referrer || undefined,
      utmSource: data.utmSource || undefined,
      utmMedium: data.utmMedium || undefined,
      utmCampaign: data.utmCampaign || undefined,
      utmContent: data.utmContent || undefined,
      utmTerm: data.utmTerm || undefined,
    },
  );

  const result = await submitProjectRequest({ ...submitInput, analyticsSessionId: data.sessionId });
  if (!result.success) return { success: false, error: result.error };

  await conversationRepo.linkLead(conversation.id, result.leadId);

  // A short, honest retrospective trail on the lead's own timeline —
  // one entry per real milestone, not one per chat message.
  const leadRepo = getLeadRepository();
  await leadRepo.createActivity(result.leadId, "ai_consultation_started");
  if (hasMinimalQualification(conversation.qualificationState)) {
    await leadRepo.createActivity(result.leadId, "ai_qualification_completed");
  }
  if (data.confirmed) {
    await leadRepo.createActivity(result.leadId, "ai_brief_confirmed");
  }
  await leadRepo.createActivity(result.leadId, "ai_lead_created", { via: "ai_consultant" });

  let whatsappUrl: string;
  try {
    whatsappUrl = await buildProjectRequestWhatsAppUrl(result.brief, result.reference, data.locale);
  } catch (error) {
    console.error("[ai-consultant] WhatsApp link build failed after successful persistence:", error);
    whatsappUrl = buildWhatsAppUrl();
  }

  return { success: true, reference: result.reference, whatsappUrl };
}

const handoffSchema = z.object({ conversationId: z.uuid(), sessionId: z.uuid() });

/** Only writes an activity if this conversation already resulted in a lead (e.g. the visitor requested a proposal earlier, then also opened the Project Builder) — most handoffs happen before any lead exists, and that's fine, nothing to log yet. */
export async function logAiHandoffToBuilderAction(input: unknown): Promise<void> {
  const parsed = handoffSchema.safeParse(input);
  if (!parsed.success) return;

  const conversationRepo = getAiConversationRepository();
  const conversation = await conversationRepo.findByIdForSession(parsed.data.conversationId, parsed.data.sessionId);
  if (!conversation?.leadId) return;

  await getLeadRepository().createActivity(conversation.leadId, "ai_handoff_to_builder");
}
