import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { StructuredBrief } from "@/domain/project-request";
import type {
  ProjectType,
  ProjectGoal,
  ProjectCapability,
  ProjectPlatform,
  BusinessState,
  ProjectTimeline,
} from "@/domain/project-request";
import { BUDGET_RANGES } from "@/config/budget-ranges";

export type BriefInput = {
  projectType: ProjectType;
  goals: ProjectGoal[];
  capabilities: ProjectCapability[];
  platforms: ProjectPlatform[];
  businessState: BusinessState;
  currentWebsite?: string;
  timeline: ProjectTimeline;
  budgetRange: string;
  message?: string;
};

/**
 * Deterministic, no AI — pure business logic mapping canonical IDs to
 * human-readable labels for the chosen locale, plus a short list of
 * open questions a salesperson should ask before scoping. The AI
 * Consultant (later phase) can enrich this; it doesn't replace it.
 */
export async function buildStructuredBrief(input: BriefInput, locale: Locale): Promise<StructuredBrief> {
  const t = await getTranslations({ locale, namespace: "projectBuilder" });

  const label = (namespace: string, id: string): string => {
    try {
      return t(`${namespace}.${id}` as never);
    } catch {
      return id;
    }
  };

  const openQuestions: string[] = [];

  if (input.projectType === "not-sure") {
    openQuestions.push(t("brief.openQuestions.clarifyProjectType"));
  }
  if (input.platforms.includes("not-sure") || input.platforms.length === 0) {
    openQuestions.push(t("brief.openQuestions.clarifyPlatforms"));
  }
  if (input.budgetRange === "not-sure") {
    openQuestions.push(t("brief.openQuestions.confirmBudget"));
  }
  if (
    (input.businessState === "existing-business" || input.businessState === "existing-product-to-improve") &&
    !input.currentWebsite
  ) {
    openQuestions.push(t("brief.openQuestions.getCurrentWebsite"));
  }
  if (input.goals.includes("other") || input.capabilities.includes("other")) {
    openQuestions.push(t("brief.openQuestions.clarifyOther"));
  }

  const budgetRange = BUDGET_RANGES.find((r) => r.id === input.budgetRange);
  const investmentRange = budgetRange ? label("budget", budgetRange.id) : input.budgetRange;

  return {
    projectType: label("whatToBuild", input.projectType),
    primaryGoals: input.goals.map((g) => label("goals", g)),
    requestedCapabilities: input.capabilities.map((c) => label("capabilities", c)),
    platforms: input.platforms.map((p) => label("platforms", p)),
    timeline: label("timeline", input.timeline),
    investmentRange,
    businessContext: label("businessState", input.businessState),
    openQuestions,
  };
}
