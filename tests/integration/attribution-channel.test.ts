import { describe, it, expect } from "vitest";
import { classifyChannel } from "@/lib/attribution/channel";
import { sanitizeUtmValue, sanitizeUrlValue } from "@/lib/attribution/sanitize-utm";

describe("classifyChannel", () => {
  it("classifies utm_medium=email as email", () => {
    expect(classifyChannel({ utmMedium: "email" })).toBe("email");
  });

  it("classifies utm_medium=cpc as paid_search", () => {
    expect(classifyChannel({ utmMedium: "cpc", utmSource: "google" })).toBe("paid_search");
  });

  it("classifies a known search engine utm_source as organic_search", () => {
    expect(classifyChannel({ utmSource: "google" })).toBe("organic_search");
  });

  it("classifies a social utm_source as social", () => {
    expect(classifyChannel({ utmMedium: "social", utmSource: "instagram" })).toBe("social");
  });

  it("falls back to referrer host classification with no UTM params", () => {
    expect(classifyChannel({ referrer: "https://www.google.com/search?q=sigma" })).toBe("organic_search");
    expect(classifyChannel({ referrer: "https://www.linkedin.com/feed" })).toBe("social");
    expect(classifyChannel({ referrer: "https://some-blog.example.com/post" })).toBe("referral");
  });

  it("classifies as direct when there's no UTM and no referrer", () => {
    expect(classifyChannel({})).toBe("direct");
  });

  it("classifies a malformed referrer URL as other rather than throwing", () => {
    expect(classifyChannel({ referrer: "not a url" })).toBe("other");
  });
});

describe("sanitizeUtmValue", () => {
  it("preserves a real campaign name untouched", () => {
    expect(sanitizeUtmValue("spring-launch-2026")).toBe("spring-launch-2026");
  });

  it("caps length", () => {
    const result = sanitizeUtmValue("x".repeat(200));
    expect(result?.length).toBe(120);
  });

  it("drops a script-shaped value", () => {
    expect(sanitizeUtmValue("<script>alert(1)</script>")).toBeUndefined();
  });

  it("drops a javascript: payload", () => {
    expect(sanitizeUtmValue("javascript:alert(1)")).toBeUndefined();
  });

  it("returns undefined for empty/missing input", () => {
    expect(sanitizeUtmValue(undefined)).toBeUndefined();
    expect(sanitizeUtmValue("")).toBeUndefined();
    expect(sanitizeUtmValue("   ")).toBeUndefined();
  });
});

describe("sanitizeUrlValue", () => {
  it("preserves a real URL untouched", () => {
    expect(sanitizeUrlValue("https://sigmaplus.agency/en/services")).toBe("https://sigmaplus.agency/en/services");
  });

  it("drops a script-shaped value", () => {
    expect(sanitizeUrlValue("javascript:alert(document.cookie)")).toBeUndefined();
  });
});
