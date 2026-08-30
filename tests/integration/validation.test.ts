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

const validProjectBuilder = {
  projectType: "website" as const,
  goals: ["generate-leads" as const],
  capabilities: [] as string[],
  platforms: ["web" as const],
  businessState: "new-idea" as const,
  timeline: "flexible" as const,
  budgetRange: "not-sure",
  name: "Valid Name",
  email: "valid@example.com",
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

  it("rejects an empty goals array (min 1 required)", () => {
    const result = projectBuilderSchema.safeParse({ ...validProjectBuilder, goals: [] });
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
