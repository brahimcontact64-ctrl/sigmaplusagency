import { describe, it, expect } from "vitest";
import { mapQualificationToBuilderPrefill } from "@/lib/ai/qualification-to-builder";
import { EMPTY_QUALIFICATION_STATE, mergeInferredQualification, type QualificationState } from "@/domain/ai-qualification";

describe("mapQualificationToBuilderPrefill", () => {
  it("maps valid canonical values through", () => {
    const state = mergeInferredQualification(
      EMPTY_QUALIFICATION_STATE,
      { projectType: "website", goals: ["generate-leads"], timeline: "asap", budgetRange: "1000-5000" },
      "msg-1",
    );
    const prefill = mapQualificationToBuilderPrefill(state);
    expect(prefill).toMatchObject({ projectType: "website", goals: ["generate-leads"], timeline: "asap", budgetRange: "1000-5000" });
  });

  it("drops a tampered/invalid value instead of passing it through to the UI", () => {
    // Simulates sessionStorage tampering (JSON.parse output is untyped at
    // runtime, same as this cast) since the handoff round-trips through it.
    const tampered = {
      ...EMPTY_QUALIFICATION_STATE,
      projectType: { value: "not-a-real-project-type", confidence: "INFERRED" as const },
      budgetRange: { value: "not-a-real-budget-id", confidence: "INFERRED" as const },
    } as unknown as QualificationState;
    const prefill = mapQualificationToBuilderPrefill(tampered);
    expect(prefill.projectType).toBeUndefined();
    expect(prefill.budgetRange).toBeUndefined();
  });

  it("filters an array field down to only its valid entries", () => {
    const tampered = {
      ...EMPTY_QUALIFICATION_STATE,
      goals: { value: ["generate-leads", "not-a-real-goal"], confidence: "INFERRED" as const },
    } as unknown as QualificationState;
    const prefill = mapQualificationToBuilderPrefill(tampered);
    expect(prefill.goals).toEqual(["generate-leads"]);
  });

  it("returns an empty object for an empty qualification state", () => {
    expect(mapQualificationToBuilderPrefill(EMPTY_QUALIFICATION_STATE)).toEqual({});
  });
});
