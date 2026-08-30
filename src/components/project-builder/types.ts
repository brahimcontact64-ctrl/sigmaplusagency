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

export const STEP_IDS = [
  "whatToBuild",
  "goals",
  "capabilities",
  "platforms",
  "businessState",
  "timeline",
  "budget",
  "contact",
  "message",
  "summary",
] as const;
export type StepId = (typeof STEP_IDS)[number];
