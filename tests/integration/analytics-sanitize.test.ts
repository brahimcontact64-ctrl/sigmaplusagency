import { describe, it, expect } from "vitest";
import { sanitizeAnalyticsProps, validateAnalyticsPayload } from "@/lib/analytics/sanitize";

describe("sanitizeAnalyticsProps", () => {
  it("strips a value shaped like an email address", () => {
    const { props, rejectedKeys } = sanitizeAnalyticsProps({ source: "person@example.com" });
    expect(props.source).toBeUndefined();
    expect(rejectedKeys).toContain("source");
  });

  it("strips a value shaped like a phone number", () => {
    const { props, rejectedKeys } = sanitizeAnalyticsProps({ context: "+213 550 47 52 48" });
    expect(props.context).toBeUndefined();
    expect(rejectedKeys).toContain("context");
  });

  it("keeps safe values untouched", () => {
    const { props, rejectedKeys } = sanitizeAnalyticsProps({ source: "newsletter", builderStepIndex: 2 });
    expect(props.source).toBe("newsletter");
    expect(props.builderStepIndex).toBe(2);
    expect(rejectedKeys).toEqual([]);
  });

  it("returns an empty result for undefined input", () => {
    expect(sanitizeAnalyticsProps(undefined)).toEqual({ props: {}, rejectedKeys: [] });
  });
});

describe("validateAnalyticsPayload", () => {
  it("accepts a well-formed, allowlisted payload", () => {
    const result = validateAnalyticsPayload("service_viewed", { serviceId: "web-development", locale: "en", pageType: "service_detail" });
    expect(result.valid).toBe(true);
  });

  it("rejects an unrecognized property key (closed schema)", () => {
    const result = validateAnalyticsPayload("page_view", { arbitraryField: "anything" });
    expect(result.valid).toBe(false);
  });

  it("rejects an oversized property value", () => {
    const result = validateAnalyticsPayload("page_view", { campaign: "x".repeat(500) });
    expect(result.valid).toBe(false);
  });

  it("rejects an invalid canonical id (not a real service)", () => {
    const result = validateAnalyticsPayload("service_viewed", { serviceId: "not-a-real-service" });
    expect(result.valid).toBe(false);
  });

  it("rejects an invalid locale", () => {
    const result = validateAnalyticsPayload("page_view", { locale: "xx" });
    expect(result.valid).toBe(false);
  });

  it("silently drops a PII-shaped value rather than storing it", () => {
    const result = validateAnalyticsPayload("page_view", { pageType: "contact", campaign: "call-me-at-0655047520" });
    // The email/phone-shaped value is stripped before schema validation,
    // so the payload as a whole is still valid — just without that field.
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.props.campaign).toBeUndefined();
    }
  });

  it("accepts an empty payload", () => {
    expect(validateAnalyticsPayload("ai_consultant_viewed", undefined).valid).toBe(true);
  });

  // Project Builder v2 §7 — the new funnel events must carry only the
  // same non-PII dimensions as everything else; the closed schema
  // enforces this structurally rather than needing per-event allowlists.
  it("validates the new project_builder_step_viewed event with a non-PII step id", () => {
    const result = validateAnalyticsPayload("project_builder_step_viewed", { builderStep: "idea", builderStepIndex: 1 });
    expect(result.valid).toBe(true);
  });

  it("validates the new optional_qualification_started/completed events with just a projectType", () => {
    expect(validateAnalyticsPayload("optional_qualification_started", { projectType: "mobile-app" }).valid).toBe(true);
    expect(validateAnalyticsPayload("optional_qualification_completed", { projectType: "mobile-app" }).valid).toBe(true);
  });

  it("rejects an attempt to smuggle the free-text idea description into a Project Builder event via an unrecognized key", () => {
    // Not PII-shaped, so it survives the value-level sanitizer — the
    // closed-schema key check must be what stops it here.
    const result = validateAnalyticsPayload("project_builder_completed", { message: "a normal-looking idea description" } as never);
    expect(result.valid).toBe(false);
  });

  it("strips a PII-shaped value even under an unrecognized key, rather than rejecting the whole event", () => {
    const result = validateAnalyticsPayload("optional_qualification_completed", { email: "person@example.com" } as never);
    // sanitizeAnalyticsProps strips PII-shaped values before the
    // schema even sees them — the event still records (with that field
    // simply absent) rather than losing the whole funnel data point,
    // but the actual email address is never present in what's stored.
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.props).not.toHaveProperty("email");
    }
  });
});
