import type { Locale } from "@/i18n/routing";
import type { QualificationState } from "@/domain/ai-qualification";
import type { SubmitProjectRequestInput } from "@/lib/services/lead-service";
import type { Attribution, PreferredContactMethod } from "@/domain/lead";

export type AiProposalContact = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  preferredContactMethod?: PreferredContactMethod;
};

/**
 * Builds a full, valid submitProjectRequest() input from whatever the
 * AI qualification actually gathered, defaulting anything missing to
 * the same neutral values Contact-page submissions already use for a
 * minimal brief (see lead-service.ts submitContact) — "not-sure" /
 * "flexible" / "new-idea" / empty arrays are real, honest defaults
 * ("we don't know yet"), never a guessed-but-wrong specific value.
 */
export function qualificationToSubmitInput(
  state: QualificationState,
  contact: AiProposalContact,
  locale: Locale,
  attribution: Attribution,
): SubmitProjectRequestInput {
  return {
    projectType: state.projectType?.value ?? "not-sure",
    goals: state.goals?.value ?? [],
    capabilities: state.capabilities?.value ?? [],
    platforms: state.platforms?.value ?? [],
    businessState: state.businessState?.value ?? "new-idea",
    currentWebsite: state.existingWebsite?.value,
    timeline: state.timeline?.value ?? "flexible",
    budgetRange: state.budgetRange?.value ?? "not-sure",
    message: state.summary ? `SIGMA AI consultation summary (AI-generated, not the client's own words): ${state.summary}` : undefined,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company || state.businessName?.value,
    country: contact.country || state.country?.value,
    preferredContactMethod: contact.preferredContactMethod,
    locale,
    ...attribution,
  };
}
