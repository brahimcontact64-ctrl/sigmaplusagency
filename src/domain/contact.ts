import { z } from "zod";
import { locales } from "@/i18n/routing";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  projectType: z.string().trim().min(1, "Required"),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  timeline: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please add a bit more detail").max(2000),
  locale: z.enum(locales),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export type ContactFormResult =
  | { success: true; whatsappUrl: string }
  | { success: false; error: string };
