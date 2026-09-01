import { describe, it, expect } from "vitest";
import { contactFormSchema } from "@/domain/contact";
import { projectBuilderSchema } from "@/domain/project-builder";

const validContact = {
  name: "Valid Name",
  email: "valid@example.com",
  projectType: "Website",
  message: "This is a long enough message for validation.",
  locale: "fr" as const,
};

// Project Builder v2 (conversion simplification) — goals/capabilities/
// platforms are no longer required (the primary flow doesn't ask for
// them any more), but `phone` and `message` (the idea description) are
// now required where they used to be optional. This fixture reflects
// what the new 4-step UI actually collects.
const validProjectBuilder = {
  projectType: "website" as const,
  goals: [] as string[],
  capabilities: [] as string[],
  platforms: [] as string[],
  businessState: "new-idea" as const,
  timeline: "flexible" as const,
  budgetRange: "not-sure",
  name: "Valid Name",
  email: "valid@example.com",
  phone: "+213555000000",
  message: "I want an app that lets my customers book appointments online.",
  locale: "fr" as const,
};

describe("contactFormSchema", () => {
  it("accepts a valid submission", () => {
    expect(contactFormSchema.safeParse(validContact).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = contactFormSchema.safeParse({ ...validContact, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a message that's too short", () => {
    const result = contactFormSchema.safeParse({ ...validContact, message: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects an unrecognized locale", () => {
    const result = contactFormSchema.safeParse({ ...validContact, locale: "xx" });
    expect(result.success).toBe(false);
  });

  it("rejects unexpected extra fields (strict mode)", () => {
    const result = contactFormSchema.safeParse({ ...validContact, isAdmin: true });
    expect(result.success).toBe(false);
  });
});

describe("projectBuilderSchema", () => {
  it("accepts a valid submission", () => {
    expect(projectBuilderSchema.safeParse(validProjectBuilder).success).toBe(true);
  });

  it("rejects an invalid projectType enum value", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, projectType: "spaceship" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty goals array — no longer required in the 4-step primary flow", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, goals: [] });
    expect(result.success).toBe(true);
  });

  it("accepts an empty platforms array — no longer required, and never fabricated (e.g. never defaulted to [\"web\"])", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, platforms: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a submission missing phone — now required (name + phone/WhatsApp are the two mandatory contact fields)", () => {
    const withoutPhone: Record<string, unknown> = { ...validProjectBuilder };
    delete withoutPhone.phone;
    const result = projectBuilderSchema.safeParse(withoutPhone);
    expect(result.success).toBe(false);
  });

  it("rejects a phone that's too short to be real", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, phone: "12" });
    expect(result.success).toBe(false);
  });

  it("rejects a submission missing the idea description (message) — now the required Step 2 content", () => {
    const withoutMessage: Record<string, unknown> = { ...validProjectBuilder };
    delete withoutMessage.message;
    const result = projectBuilderSchema.safeParse(withoutMessage);
    expect(result.success).toBe(false);
  });

  it("rejects an idea description shorter than the minimum", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, message: "too short" });
    expect(result.success).toBe(false);
  });

  it("still requires a valid email even though the spec asked for it to be optional — leads.email is a NOT NULL column (see domain/project-builder.ts)", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid budgetRange not present in configuration", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, budgetRange: "a-billion-dollars" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed currentWebsite value", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, currentWebsite: "not a url at all!!" });
    expect(result.success).toBe(false);
  });

  it("accepts a bare-domain currentWebsite without a protocol", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, currentWebsite: "example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an oversized message payload", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, message: "a".repeat(3000) });
    expect(result.success).toBe(false);
  });
});
