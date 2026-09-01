import { z } from "zod";
import { locales } from "@/i18n/routing";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";
import { BUDGET_RANGE_IDS } from "@/config/budget-ranges";
import { SUPPORTED_CURRENCIES } from "@/lib/money";
import {
  PROJECT_TYPES,
  PROJECT_GOALS,
  PROJECT_CAPABILITIES,
  PROJECT_PLATFORMS,
  BUSINESS_STATES,
  PROJECT_TIMELINES,
} from "./project-request";
import { PREFERRED_CONTACT_METHODS } from "./lead";

// Loose enough to accept "example.com" as well as "https://example.com" —
// the goal is catching garbage input, not enforcing a strict URL grammar
// that would reject what a non-technical visitor actually types.
const looseUrlPattern = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i;

const attributionSchema = z.object({
  landingPage: z.string().trim().max(500).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  utmSource: z.string().trim().max(120).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(120).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(120).optional().or(z.literal("")),
  utmContent: z.string().trim().max(120).optional().or(z.literal("")),
  utmTerm: z.string().trim().max(120).optional().or(z.literal("")),
});

export const projectBuilderSchema = z
  .object({
    projectType: z.enum(PROJECT_TYPES),
    goals: z.array(z.enum(PROJECT_GOALS)).min(1).max(PROJECT_GOALS.length),
    capabilities: z.array(z.enum(PROJECT_CAPABILITIES)).max(PROJECT_CAPABILITIES.length),
    platforms: z.array(z.enum(PROJECT_PLATFORMS)).min(1).max(PROJECT_PLATFORMS.length),

    businessState: z.enum(BUSINESS_STATES),
    currentWebsite: z
      .string()
      .trim()
      .max(300)
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || looseUrlPattern.test(v), "Invalid URL"),

    timeline: z.enum(PROJECT_TIMELINES),
    budgetRange: z.string().refine((v) => BUDGET_RANGE_IDS.includes(v), "Invalid budget range"),
    // Phase 11 §6 — which currency the visitor was actually shown when
    // picking budgetRange. Optional so older/unrelated callers of this
    // schema keep working unchanged.
    budgetCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),

    name: z.string().trim().min(2, "Name is too short").max(120),
    email: z.string().trim().email("Invalid email"),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    country: z.string().trim().max(80).optional().or(z.literal("")),
    preferredContactMethod: z.enum(PREFERRED_CONTACT_METHODS).optional(),

    message: z.string().trim().max(2000).optional().or(z.literal("")),
    locale: z.enum(locales),
    [HONEYPOT_FIELD_NAME]: z.string().max(200).optional().or(z.literal("")),
  })
  .merge(attributionSchema)
  .strict();

export type ProjectBuilderInput = z.infer<typeof projectBuilderSchema>;

export type ProjectBuilderResult =
  | { success: true; reference: string; whatsappUrl: string }
  | { success: false; error: "validation_error" | "rate_limited" | "db_unavailable" | "maintenance" | "unexpected" };
