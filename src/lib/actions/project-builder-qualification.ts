"use server";

import { optionalQualificationSchema, type OptionalQualificationResult } from "@/domain/optional-qualification";
import { attachOptionalQualification } from "@/lib/services/lead-service";
import { submissionRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";

/**
 * Project Builder v2 §3 — the optional post-submission qualification
 * step's server boundary. Rate-limited the same way the primary
 * submission is (this still writes to the database), but note it can
 * never create a lead or project request on its own: `reference` +
 * `projectRequestId` must already both exist and agree on the same
 * lead (checked in attachOptionalQualification) or this returns
 * "not_found" without writing anything.
 */
export async function submitOptionalQualification(formData: unknown): Promise<OptionalQualificationResult> {
  if (isMaintenanceModeEnabled()) {
    return { success: false, error: "unexpected" };
  }

  const parsed = optionalQualificationSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "validation_error" };
  }

  const ip = await getClientIp();
  if (!(await submissionRateLimiter.check(`project-builder-qualification:${ip}`))) {
    return { success: false, error: "unexpected" };
  }

  return attachOptionalQualification(parsed.data);
}
