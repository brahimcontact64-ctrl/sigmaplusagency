import { z } from "zod";
import { locales } from "@/i18n/routing";
import { SERVICE_IDS } from "./service";
import { PROJECT_IDS } from "./case-study";
import { PROJECT_TYPES } from "./project-request";

/**
 * The one, canonical SIGMA+ event taxonomy — see
 * docs/ANALYTICS_MEASUREMENT_PLAN.md for what each event means and how
 * it's used. This supersedes/extends the flat list that used to live
 * directly in `src/lib/integrations/analytics.ts`; that file now
 * imports from here instead of maintaining a second list, per Phase 9
 * §2's explicit "do not create a second competing analytics system."
 *
 * Every event name here is deliberately singular in meaning — e.g.
 * there is one `whatsapp_handoff_clicked`, not a per-surface variant,
 * because the surface itself is a `context` property, not a new event.
 */
export const ANALYTICS_EVENTS = [
  "page_view",
  "cta_click",
  "service_viewed",
  "case_study_viewed",
  "article_viewed",
  "project_builder_viewed",
  "project_builder_started",
  "project_builder_step_completed",
  "project_builder_abandoned",
  "project_builder_completed",
  "ai_consultant_viewed",
  "ai_consultation_started",
  "ai_message_sent",
  "ai_qualification_updated",
  "ai_builder_handoff",
  "ai_contact_requested",
  "ai_error",
  "contact_form_started",
  "contact_form_submitted",
  "contact_form_failed",
  "lead_created",
  "whatsapp_handoff_clicked",
  "proposal_requested",
  "web_vital",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * The complete, closed set of safe dimensions any event may carry —
 * `.strict()` means an unlisted key is a validation error, not silently
 * dropped or silently accepted. Nothing here is PII: `articleId`/
 * `aiConversationId` are internal UUIDs but identify a piece of
 * *content* or a *conversation*, never a person — see
 * `src/lib/analytics/sanitize.ts` for the belt-and-suspenders string-
 * shape checks (email/phone-looking values) on top of this allowlist.
 */
export const analyticsPropsSchema = z
  .object({
    locale: z.enum(locales).optional(),
    pageType: z.string().trim().max(60).optional(),
    serviceId: z.enum(SERVICE_IDS).optional(),
    caseStudyId: z.enum(PROJECT_IDS).optional(),
    articleId: z.uuid().optional(),
    projectType: z.enum(PROJECT_TYPES).optional(),
    builderStep: z.string().trim().max(60).optional(),
    builderStepIndex: z.number().int().min(0).max(50).optional(),
    source: z.string().trim().max(60).optional(),
    medium: z.string().trim().max(60).optional(),
    campaign: z.string().trim().max(120).optional(),
    deviceClass: z.enum(["mobile", "tablet", "desktop"]).optional(),
    conversionSurface: z.string().trim().max(80).optional(),
    ctaId: z.string().trim().max(80).optional(),
    /** The public `SP-XXXXXX` reference — never a raw database ID. */
    reference: z
      .string()
      .trim()
      .max(20)
      .regex(/^SP-[A-Z0-9]+$/)
      .optional(),
    aiConversationId: z.uuid().optional(),
    isNewConversation: z.boolean().optional(),
    hasConversation: z.boolean().optional(),
    /** A stable failure-reason code (e.g. "db_unavailable", "network"), never a raw error message or stack. */
    reason: z.string().trim().max(60).optional(),
    context: z.string().trim().max(60).optional(),
    metric: z.enum(["LCP", "CLS", "INP"]).optional(),
    value: z.number().finite().optional(),
    rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  })
  .strict();

export type AnalyticsProps = z.infer<typeof analyticsPropsSchema>;
