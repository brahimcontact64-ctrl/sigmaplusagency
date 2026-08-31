import { describe, it, expect } from "vitest";
import { classifyPageType } from "@/lib/analytics/page-type";

describe("classifyPageType", () => {
  it("classifies the locale root as home", () => {
    expect(classifyPageType("/en")).toBe("home");
  });

  it("classifies a service detail page", () => {
    expect(classifyPageType("/en/services/web-design")).toBe("service_detail");
  });

  it("classifies the services index", () => {
    expect(classifyPageType("/en/services")).toBe("services_index");
  });

  it("classifies a case study detail page", () => {
    expect(classifyPageType("/fr/work/saheat")).toBe("case_study_detail");
  });

  it("classifies an article detail page", () => {
    expect(classifyPageType("/de/insights/some-article")).toBe("article_detail");
  });

  it("classifies known fixed routes", () => {
    expect(classifyPageType("/en/start-project")).toBe("project_builder");
    expect(classifyPageType("/en/ai-consultant")).toBe("ai_consultant");
    expect(classifyPageType("/en/contact")).toBe("contact");
    expect(classifyPageType("/en/about")).toBe("about");
  });

  it("falls back to the raw segment for an unrecognized route", () => {
    expect(classifyPageType("/en/some-new-route")).toBe("some-new-route");
  });
});
