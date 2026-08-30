import { describe, it, expect } from "vitest";
import {
  EMPTY_QUALIFICATION_STATE,
  mergeInferredQualification,
  confirmAllInferred,
  hasMinimalQualification,
  type QualificationState,
} from "@/domain/ai-qualification";

describe("mergeInferredQualification", () => {
  it("writes new fields as INFERRED with the source message id", () => {
    const result = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, { projectType: "website" }, "msg-1");
    expect(result.projectType).toEqual({ value: "website", confidence: "INFERRED", sourceMessageId: "msg-1" });
  });

  it("overwrites an existing INFERRED field with a newer inference", () => {
    const state = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, { timeline: "flexible" }, "msg-1");
    const updated = mergeInferredQualification(state, { timeline: "asap" }, "msg-2");
    expect(updated.timeline).toEqual({ value: "asap", confidence: "INFERRED", sourceMessageId: "msg-2" });
  });

  it("never overwrites a USER_CONFIRMED field with a new inference", () => {
    const confirmed: QualificationState = {
      ...EMPTY_QUALIFICATION_STATE,
      timeline: { value: "asap", confidence: "USER_CONFIRMED" },
    };
    const updated = mergeInferredQualification(confirmed, { timeline: "flexible" }, "msg-2");
    expect(updated.timeline).toEqual({ value: "asap", confidence: "USER_CONFIRMED" });
  });

  it("merges openQuestions and recommendedServices as plain overwrites, not per-field confidence", () => {
    const result = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, {}, "msg-1", {
      openQuestions: ["Which platforms?"],
      recommendedServices: ["web-development"],
    });
    expect(result.openQuestions).toEqual(["Which platforms?"]);
    expect(result.recommendedServices).toEqual(["web-development"]);
  });

  it("leaves fields not present in the extraction untouched", () => {
    const state = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, { projectType: "website" }, "msg-1");
    const updated = mergeInferredQualification(state, { timeline: "asap" }, "msg-2");
    expect(updated.projectType?.value).toBe("website");
    expect(updated.timeline?.value).toBe("asap");
  });
});

describe("confirmAllInferred", () => {
  it("promotes every populated field to USER_CONFIRMED", () => {
    const state = mergeInferredQualification(
      EMPTY_QUALIFICATION_STATE,
      { projectType: "website", timeline: "asap" },
      "msg-1",
    );
    const confirmed = confirmAllInferred(state);
    expect(confirmed.projectType?.confidence).toBe("USER_CONFIRMED");
    expect(confirmed.timeline?.confidence).toBe("USER_CONFIRMED");
  });

  it("leaves unset fields untouched", () => {
    const confirmed = confirmAllInferred(EMPTY_QUALIFICATION_STATE);
    expect(confirmed.projectType).toBeUndefined();
  });
});

describe("hasMinimalQualification", () => {
  it("is false for an empty state", () => {
    expect(hasMinimalQualification(EMPTY_QUALIFICATION_STATE)).toBe(false);
  });

  it("is true once a project type is known", () => {
    const state = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, { projectType: "website" }, "msg-1");
    expect(hasMinimalQualification(state)).toBe(true);
  });

  it("is true once at least one goal is known, even without a project type", () => {
    const state = mergeInferredQualification(EMPTY_QUALIFICATION_STATE, { goals: ["generate-leads"] }, "msg-1");
    expect(hasMinimalQualification(state)).toBe(true);
  });
});
