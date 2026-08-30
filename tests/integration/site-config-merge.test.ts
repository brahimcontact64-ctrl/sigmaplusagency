import { describe, it, expect } from "vitest";
import { applyCompanyIdentityOverride, type EffectiveSiteConfig } from "@/lib/site-config-merge";

const base: EffectiveSiteConfig = {
  name: "SIGMA+",
  legalName: "SIGMA+ Agency",
  url: "https://sigmaplus.agency",
  whatsappNumber: "436602313221",
  contactPhone: "+213 550 47 52 48",
  contactEmail: "brahimcontact64@gmail.com",
};

describe("applyCompanyIdentityOverride", () => {
  it("returns the base config unchanged when there's no override", () => {
    expect(applyCompanyIdentityOverride(base, null)).toEqual(base);
  });

  it("overrides only the fields present in the setting", () => {
    const result = applyCompanyIdentityOverride(base, {
      companyName: "New Name",
      contactEmail: "new@example.com",
      contactPhone: base.contactPhone,
      whatsappNumber: base.whatsappNumber,
    });
    expect(result.name).toBe("New Name");
    expect(result.contactEmail).toBe("new@example.com");
    expect(result.legalName).toBe(base.legalName);
    expect(result.url).toBe(base.url);
  });

  it("falls back to the base value for an empty/whitespace override field", () => {
    const result = applyCompanyIdentityOverride(base, {
      companyName: "   ",
      contactEmail: base.contactEmail,
      contactPhone: base.contactPhone,
      whatsappNumber: base.whatsappNumber,
    });
    expect(result.name).toBe(base.name);
  });
});
