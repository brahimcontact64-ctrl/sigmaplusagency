import { z } from "zod";
import { PROJECT_GOALS, PROJECT_CAPABILITIES, PROJECT_PLATFORMS } from "./project-request";

/**
 * Project Builder v2 §3 — the optional, post-submission progressive
 * qualification step. Deliberately narrow: it only ever *adds* goals/
 * capabilities/platforms to an *existing* project request (looked up
 * by the public reference already shown to the visitor plus the
 * project request id returned at submission time) — it can never
 * create a new lead or project request, so it cannot produce a
 * duplicate. Skipping it entirely is always valid; nothing here is
 * required for the primary submission to have already succeeded.
 */
export const optionalQualificationSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .max(20)
      .regex(/^SP-[A-Z0-9]+$/, "Invalid reference"),
    projectRequestId: z.uuid(),
    goals: z.array(z.enum(PROJECT_GOALS)).max(PROJECT_GOALS.length),
    capabilities: z.array(z.enum(PROJECT_CAPABILITIES)).max(PROJECT_CAPABILITIES.length),
    platforms: z.array(z.enum(PROJECT_PLATFORMS)).max(PROJECT_PLATFORMS.length),
  })
  .strict();

export type OptionalQualificationInput = z.infer<typeof optionalQualificationSchema>;

export type OptionalQualificationResult =
  | { success: true }
  | { success: false; error: "validation_error" | "not_found" | "unexpected" };
