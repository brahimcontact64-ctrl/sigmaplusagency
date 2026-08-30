import { describe, it, expect } from "vitest";
import { qualificationToSubmitInput } from "@/lib/ai/qualification-to-project-request";
import { EMPTY_QUALIFICATION_STATE, mergeInferredQualification } from "@/domain/ai-qualification";

describe("qualificationToSubmitInput", () => {
  it("defaults every project field to the same neutral values submitContact uses when qualification is empty", () => {
    const input = qualificationToSubmitInput(EMPTY_QUALIFICATION_STATE, { name: "Jane", email: "jane@example.com" }, "en", {});
    expect(input).toMatchObject({
      projectType: "not-sure",
      goals: [],
      capabilities: [],
      platforms: [],
      businessState: "new-idea",
      timeline: "flexible",
      budgetRange: "not-sure",
      name: "Jane",
      email: "jane@example.com",
    });
  });

  it("uses whatever the AI actually gathered instead of the defaults", () => {
    const state = mergeInferredQualification(
      EMPTY_QUALIFICATION_STATE,
      { projectType: "ecommerce", goals: ["sell-products"], timeline: "asap", budgetRange: "5000-15000" },
      "msg-1",
    );
    const input = qualificationToSubmitInput(state, { name: "Jane", email: "jane@example.com" }, "en", {});
    expect(input.projectType).toBe("ecommerce");
    expect(input.goals).toEqual(["sell-products"]);
    expect(input.timeline).toBe("asap");
    expect(input.budgetRange).toBe("5000-15000");
  });

  it("prefers an explicitly provided company/country over the AI-inferred one, but falls back to it", () => {
    const state = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, { businessName: "Acme Inc", country: "Algeria" }, "msg-1");

    const withExplicit = qualificationToSubmitInput(state, { name: "Jane", email: "jane@example.com", company: "Explicit Co" }, "en", {});
    expect(withExplicit.company).toBe("Explicit Co");

    const withoutExplicit = qualificationToSubmitInput(state, { name: "Jane", email: "jane@example.com" }, "en", {});
    expect(withoutExplicit.company).toBe("Acme Inc");
    expect(withoutExplicit.country).toBe("Algeria");
  });

  it("labels the AI-generated summary as such rather than presenting it as the client's own words", () => {
    const state = { ...EMPTY_QUALIFICATION_STATE, summary: "Wants a booking system for a small clinic." };
    const input = qualificationToSubmitInput(state, { name: "Jane", email: "jane@example.com" }, "en", {});
    expect(input.message).toContain("AI-generated");
    expect(input.message).toContain("Wants a booking system for a small clinic.");
  });

  it("passes attribution through unchanged", () => {
    const input = qualificationToSubmitInput(
      EMPTY_QUALIFICATION_STATE,
      { name: "Jane", email: "jane@example.com" },
      "en",
      { utmSource: "google", landingPage: "https://sigmaplus.agency/en" },
    );
    expect(input.utmSource).toBe("google");
    expect(input.landingPage).toBe("https://sigmaplus.agency/en");
  });
});
