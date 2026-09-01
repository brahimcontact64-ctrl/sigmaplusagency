import type {
  ProjectType,
  ProjectGoal,
  ProjectCapability,
  ProjectPlatform,
  BusinessState,
  ProjectTimeline,
} from "@/domain/project-request";
import type { PreferredContactMethod } from "@/domain/lead";

export type BuilderFormData = {
  projectType?: ProjectType;
  goals: ProjectGoal[];
  capabilities: ProjectCapability[];
  platforms: ProjectPlatform[];
  businessState?: BusinessState;
  currentWebsite: string;
  timeline?: ProjectTimeline;
  budgetRange?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  preferredContactMethod?: PreferredContactMethod;
  message: string;
};

export const EMPTY_FORM_DATA: BuilderFormData = {
  goals: [],
  capabilities: [],
  platforms: [],
  currentWebsite: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  country: "",
  message: "",
};

/**
 * Project Builder v2 (conversion simplification) — 4 steps instead of
 * the previous 10. `goals`/`capabilities`/`platforms`/`businessState`
 * (full)/`timeline`/`budget` no longer have their own dedicated steps;
 * `businessState` becomes a compact inline choice inside `idea`, and
 * `timeline` is folded into `budgetTiming` alongside the budget grid.
 * The old standalone `summary` review screen is dropped — Contact is
 * now the final step and its own Continue button is the submit action.
 */
export const STEP_IDS = ["whatToBuild", "idea", "budgetTiming", "contact"] as const;
export type StepId = (typeof STEP_IDS)[number];
