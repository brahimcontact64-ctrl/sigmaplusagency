import { z } from "zod";
import { locales } from "@/i18n/routing";

/** The minimal contact-capture step inside the AI panel, shown only once the visitor explicitly asks to be contacted/get a proposal — never collected upfront. */
export const aiLeadCaptureSchema = z
  .object({
    conversationId: z.uuid(),
    sessionId: z.uuid(),
    locale: z.enum(locales),
    name: z.string().trim().min(2).max(120),
    email: z.email(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    country: z.string().trim().max(100).optional().or(z.literal("")),
    confirmed: z.boolean(),
    landingPage: z.string().trim().max(500).optional().or(z.literal("")),
    referrer: z.string().trim().max(500).optional().or(z.literal("")),
    utmSource: z.string().trim().max(120).optional().or(z.literal("")),
    utmMedium: z.string().trim().max(120).optional().or(z.literal("")),
    utmCampaign: z.string().trim().max(120).optional().or(z.literal("")),
    utmContent: z.string().trim().max(120).optional().or(z.literal("")),
    utmTerm: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .strict();

export type AiLeadCaptureInput = z.infer<typeof aiLeadCaptureSchema>;
