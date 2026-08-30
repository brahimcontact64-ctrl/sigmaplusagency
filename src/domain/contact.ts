import { z } from "zod";
import { locales } from "@/i18n/routing";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";

const attributionSchema = z.object({
  landingPage: z.string().trim().max(500).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  utmSource: z.string().trim().max(120).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(120).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(120).optional().or(z.literal("")),
  utmContent: z.string().trim().max(120).optional().or(z.literal("")),
  utmTerm: z.string().trim().max(120).optional().or(z.literal("")),
});

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(120),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    email: z.string().trim().email("Invalid email"),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    projectType: z.string().trim().min(1, "Required"),
    budget: z.string().trim().max(80).optional().or(z.literal("")),
    timeline: z.string().trim().max(80).optional().or(z.literal("")),
    message: z.string().trim().min(10, "Please add a bit more detail").max(2000),
    locale: z.enum(locales),
    [HONEYPOT_FIELD_NAME]: z.string().max(200).optional().or(z.literal("")),
  })
  .merge(attributionSchema)
  .strict();

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export type ContactFormResult =
  | { success: true; reference: string; whatsappUrl: string }
  | { success: false; error: "validation_error" | "rate_limited" | "db_unavailable" | "unexpected" };
