import { describe, it, expect } from "vitest";
import {
  projectInquirySchema,
  buildMagicFluxPayload,
  mapInquiryServiceToProjectType,
  INQUIRY_SERVICES,
  URGENCY_LEVELS,
  PURCHASE_INTENT_LEVELS,
} from "@/domain/project-inquiry";
import { PROJECT_TYPES, PROJECT_TIMELINES } from "@/domain/project-request";
import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Amine Test",
    email: "amine@example.com",
    phone: "",
    company: "",
    service: "ecommerce",
    projectDescription: "I need an online store for my clothing brand.",
    budgetRange: "5000-15000",
    budgetCurrency: "EUR",
    desiredStart: "within-1-month",
    urgency: "soon",
    purchaseIntent: "ready-to-discuss",
    locale: "en",
    submissionNonce: "a-stable-nonce-123",
    [HONEYPOT_FIELD_NAME]: "",
    ...overrides,
  };
}

describe("projectInquirySchema — the real MagicFlux inquiry form's validation boundary", () => {
  it("accepts a fully valid submission", () => {
    expect(projectInquirySchema.safeParse(validInput()).success).toBe(true);
  });

  for (const field of ["name", "email", "service", "projectDescription", "budgetRange", "desiredStart", "urgency", "purchaseIntent", "locale", "submissionNonce"]) {
    it(`rejects a submission missing required field "${field}"`, () => {
      const input = validInput();
      delete (input as Record<string, unknown>)[field];
      expect(projectInquirySchema.safeParse(input).success).toBe(false);
    });
  }

  it("phone and company are genuinely optional", () => {
    const input = validInput({ phone: undefined, company: undefined });
    expect(projectInquirySchema.safeParse(input).success).toBe(true);
  });

  it("rejects a service value outside the closed taxonomy — never a free-typed string", () => {
    expect(projectInquirySchema.safeParse(validInput({ service: "consulting" })).success).toBe(false);
  });

  it("rejects a budget range id that isn't one of the configured bands — never uncontrolled text", () => {
    expect(projectInquirySchema.safeParse(validInput({ budgetRange: "a lot of money" })).success).toBe(false);
  });

  it("rejects an urgency/purchase-intent value outside the closed set", () => {
    expect(projectInquirySchema.safeParse(validInput({ urgency: "eventually" })).success).toBe(false);
    expect(projectInquirySchema.safeParse(validInput({ purchaseIntent: "maybe" })).success).toBe(false);
  });

  it("rejects an unknown extra field (strict schema) — never silently accepts a client-injected classification hint", () => {
    const result = projectInquirySchema.safeParse(validInput({ hotWarmCold: "HOT" }));
    expect(result.success).toBe(false);
  });

  it("rejects a project description that's too short to be useful", () => {
    expect(projectInquirySchema.safeParse(validInput({ projectDescription: "hi" })).success).toBe(false);
  });

  it("a filled honeypot field still passes schema validation (rejection happens one layer up, in the action) but the value round-trips", () => {
    const result = projectInquirySchema.safeParse(validInput({ [HONEYPOT_FIELD_NAME]: "http://spam.example" }));
    expect(result.success).toBe(true);
  });
});

describe("mapInquiryServiceToProjectType — never invents a new CRM taxonomy", () => {
  it("maps every inquiry service to a real, existing ProjectType", () => {
    for (const service of INQUIRY_SERVICES) {
      expect(PROJECT_TYPES).toContain(mapInquiryServiceToProjectType(service));
    }
  });

  it("maps 'other' to the honest 'not-sure' bucket, never a guess", () => {
    expect(mapInquiryServiceToProjectType("other")).toBe("not-sure");
  });
});

describe("buildMagicFluxPayload — the canonical §2 contract, pure and dependency-free", () => {
  it("includes every field the brief requires, under its exact required name", () => {
    const payload = buildMagicFluxPayload({
      name: "Amine Test",
      email: "amine@example.com",
      service: "ecommerce",
      projectDescription: "An online store.",
      budgetRangeId: "5000-15000",
      budgetCurrency: "EUR",
      urgency: "soon",
      purchaseIntent: "ready-to-discuss",
      desiredStart: "within-1-month",
      locale: "en",
      reference: "SP-ABC123",
      submittedAt: "2026-09-15T00:00:00.000Z",
    });

    expect(payload).toMatchObject({
      name: "Amine Test",
      email: "amine@example.com",
      phone: "",
      company: "",
      service: "ecommerce",
      project_description: "An online store.",
      budget: "5000-15000",
      urgency: "soon",
      purchase_intent: "ready-to-discuss",
      desired_start: "within-1-month",
      source: "sigma_plus_agency",
    });
  });

  it("never omits phone/company as a missing key when absent — always an empty string", () => {
    const payload = buildMagicFluxPayload({
      name: "A",
      email: "a@example.com",
      service: "other",
      projectDescription: "desc",
      budgetRangeId: "not-sure",
      budgetCurrency: "EUR",
      urgency: "flexible",
      purchaseIntent: "exploring",
      desiredStart: "flexible",
      locale: "fr",
      reference: "SP-XYZ789",
      submittedAt: "2026-09-15T00:00:00.000Z",
    });
    expect(payload.phone).toBe("");
    expect(payload.company).toBe("");
    expect("phone" in payload).toBe(true);
    expect("company" in payload).toBe(true);
  });

  it("source is always the fixed literal, never derived from input", () => {
    const payload = buildMagicFluxPayload({
      name: "A",
      email: "a@example.com",
      service: "other",
      projectDescription: "desc",
      budgetRangeId: "not-sure",
      budgetCurrency: "EUR",
      urgency: "flexible",
      purchaseIntent: "exploring",
      desiredStart: "flexible",
      locale: "fr",
      reference: "SP-XYZ789",
      submittedAt: "2026-09-15T00:00:00.000Z",
    });
    expect(payload.source).toBe("sigma_plus_agency");
  });

  it("desiredStart reuses the real ProjectTimeline ids — no parallel taxonomy", () => {
    for (const timeline of PROJECT_TIMELINES) {
      const payload = buildMagicFluxPayload({
        name: "A",
        email: "a@example.com",
        service: "other",
        projectDescription: "desc",
        budgetRangeId: "not-sure",
        budgetCurrency: "EUR",
        urgency: "flexible",
        purchaseIntent: "exploring",
        desiredStart: timeline,
        locale: "fr",
        reference: "SP-1",
        submittedAt: "2026-09-15T00:00:00.000Z",
      });
      expect(payload.desired_start).toBe(timeline);
    }
  });

  it("urgency/purchase_intent values are always one of the closed sets", () => {
    for (const urgency of URGENCY_LEVELS) {
      for (const purchaseIntent of PURCHASE_INTENT_LEVELS) {
        const payload = buildMagicFluxPayload({
          name: "A",
          email: "a@example.com",
          service: "other",
          projectDescription: "desc",
          budgetRangeId: "not-sure",
          budgetCurrency: "EUR",
          urgency,
          purchaseIntent,
          desiredStart: "flexible",
          locale: "fr",
          reference: "SP-1",
          submittedAt: "2026-09-15T00:00:00.000Z",
        });
        expect(URGENCY_LEVELS).toContain(payload.urgency);
        expect(PURCHASE_INTENT_LEVELS).toContain(payload.purchase_intent);
      }
    }
  });
});
