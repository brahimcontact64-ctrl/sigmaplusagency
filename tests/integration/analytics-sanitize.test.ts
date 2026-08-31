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
});
