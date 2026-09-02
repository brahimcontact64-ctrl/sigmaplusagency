import { describe, it, expect } from "vitest";
import {
  PRIMARY_PROJECT_TYPE_IDS,
  PRIMARY_TIMELINE_IDS,
  PRIMARY_BUSINESS_STATE_IDS,
  CAPABILITIES_BY_TYPE,
  shouldAskPlatforms,
} from "@/config/project-builder-flow";
import { PROJECT_TYPES, PROJECT_TIMELINES, BUSINESS_STATES, PROJECT_CAPABILITIES } from "@/domain/project-request";
import { isStepValid, REQUIRED_MESSAGE_MIN, REQUIRED_PHONE_MIN } from "@/lib/project-builder/step-validity";
import { EMPTY_FORM_DATA, STEP_IDS, type BuilderFormData } from "@/components/project-builder/types";

describe("Project Builder v2 flow config — never invents a new canonical ID", () => {
  it("every primary project-type card is a real, existing ProjectType", () => {
    for (const id of PRIMARY_PROJECT_TYPE_IDS) {
      expect(PROJECT_TYPES).toContain(id);
    }
    expect(PRIMARY_PROJECT_TYPE_IDS.length).toBe(6);
  });

  it("every primary timeline option is a real, existing ProjectTimeline", () => {
    for (const id of PRIMARY_TIMELINE_IDS) {
      expect(PROJECT_TIMELINES).toContain(id);
    }
    expect(PRIMARY_TIMELINE_IDS.length).toBe(4);
  });

  it("every primary business-state option is a real, existing BusinessState", () => {
    for (const id of PRIMARY_BUSINESS_STATE_IDS) {
      expect(BUSINESS_STATES).toContain(id);
    }
    expect(PRIMARY_BUSINESS_STATE_IDS.length).toBe(2);
  });

  it("historical business states dropped from the primary UI remain valid canonical values", () => {
    expect(BUSINESS_STATES).toContain("existing-product-to-improve");
    expect(BUSINESS_STATES).toContain("existing-process-to-automate");
    expect(PRIMARY_BUSINESS_STATE_IDS).not.toContain("existing-product-to-improve");
  });

  it("every capability listed for adaptive qualification is a real, existing ProjectCapability", () => {
    for (const ids of Object.values(CAPABILITIES_BY_TYPE)) {
      for (const id of ids!) {
        expect(PROJECT_CAPABILITIES).toContain(id);
      }
    }
  });
});

describe("shouldAskPlatforms", () => {
  it("asks for mobile-app, saas-platform, and not-sure", () => {
    expect(shouldAskPlatforms("mobile-app")).toBe(true);
    expect(shouldAskPlatforms("saas-platform")).toBe(true);
    expect(shouldAskPlatforms("not-sure")).toBe(true);
  });

  it("does not ask for website or ecommerce", () => {
    expect(shouldAskPlatforms("website")).toBe(false);
    expect(shouldAskPlatforms("ecommerce")).toBe(false);
  });

  it("does not ask when project type is unknown", () => {
    expect(shouldAskPlatforms(undefined)).toBe(false);
  });
});

describe("Project Builder v2 — 4-step state progression", () => {
  it("has exactly 4 steps, in the expected order", () => {
    expect(STEP_IDS).toEqual(["whatToBuild", "idea", "budgetTiming", "contact"]);
  });

  it("step 1 (whatToBuild) requires only a project type", () => {
    expect(isStepValid("whatToBuild", EMPTY_FORM_DATA)).toBe(false);
    expect(isStepValid("whatToBuild", { ...EMPTY_FORM_DATA, projectType: "website" })).toBe(true);
  });

  it("step 2 (idea) requires a sufficiently long idea description and a business state", () => {
    const short: BuilderFormData = { ...EMPTY_FORM_DATA, message: "too short", businessState: "new-idea" };
    expect(isStepValid("idea", short)).toBe(false);

    const noBusinessState: BuilderFormData = { ...EMPTY_FORM_DATA, message: "a".repeat(REQUIRED_MESSAGE_MIN) };
    expect(isStepValid("idea", noBusinessState)).toBe(false);

    const valid: BuilderFormData = {
      ...EMPTY_FORM_DATA,
      message: "a".repeat(REQUIRED_MESSAGE_MIN),
      businessState: "existing-business",
    };
    expect(isStepValid("idea", valid)).toBe(true);
  });

  it("step 3 (budgetTiming) requires both a timeline and a budget range", () => {
    expect(isStepValid("budgetTiming", EMPTY_FORM_DATA)).toBe(false);
    expect(isStepValid("budgetTiming", { ...EMPTY_FORM_DATA, timeline: "asap" })).toBe(false);
    expect(isStepValid("budgetTiming", { ...EMPTY_FORM_DATA, timeline: "asap", budgetRange: "not-sure" })).toBe(true);
  });

  it("'not sure' is always a valid answer for budget", () => {
    expect(isStepValid("budgetTiming", { ...EMPTY_FORM_DATA, timeline: "flexible", budgetRange: "not-sure" })).toBe(true);
  });

  it("step 4 (contact) requires name, phone, and a valid email — company stays optional", () => {
    expect(isStepValid("contact", EMPTY_FORM_DATA)).toBe(false);

    const missingPhone: BuilderFormData = { ...EMPTY_FORM_DATA, name: "Amine", email: "amine@example.com" };
    expect(isStepValid("contact", missingPhone)).toBe(false);

    const shortPhone: BuilderFormData = {
      ...EMPTY_FORM_DATA,
      name: "Amine",
      email: "amine@example.com",
      phone: "1".repeat(REQUIRED_PHONE_MIN - 1),
    };
    expect(isStepValid("contact", shortPhone)).toBe(false);

    const invalidEmail: BuilderFormData = {
      ...EMPTY_FORM_DATA,
      name: "Amine",
      email: "not-an-email",
      phone: "0550475248",
    };
    expect(isStepValid("contact", invalidEmail)).toBe(false);

    const valid: BuilderFormData = {
      ...EMPTY_FORM_DATA,
      name: "Amine",
      email: "amine@example.com",
      phone: "0550475248",
    };
    expect(isStepValid("contact", valid)).toBe(true);
    // Company stays optional — its absence must never block a valid submission.
    expect(valid.company).toBe("");
  });

  it("email is genuinely optional — blank email + valid name/phone is a valid step 4", () => {
    const phoneOnly: BuilderFormData = { ...EMPTY_FORM_DATA, name: "Amine", email: "", phone: "0550475248" };
    expect(isStepValid("contact", phoneOnly)).toBe(true);
  });
});
