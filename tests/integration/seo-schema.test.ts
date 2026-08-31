import { describe, it, expect } from "vitest";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildServiceSchema,
  buildCaseStudySchema,
  buildFaqPageSchema,
  buildBreadcrumbListSchema,
  withSchemaContext,
  organizationId,
} from "@/lib/seo/schema";
import type { EffectiveSiteConfig } from "@/lib/site-config-merge";

const config: EffectiveSiteConfig = {
  name: "SIGMA+",
  legalName: "SIGMA+ Agency",
  url: "https://sigmaplus.agency",
  whatsappNumber: "436602313221",
  contactPhone: "+213 550 47 52 48",
  contactEmail: "hello@sigmaplus.agency",
};

describe("Organization / WebSite schema", () => {
  it("builds a truthful ProfessionalService entity with a stable @id", () => {
    const schema = buildOrganizationSchema(config);
    expect(schema["@type"]).toBe("ProfessionalService");
    expect(schema["@id"]).toBe(`${config.url}#organization`);
    expect(schema.name).toBe(config.legalName);
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema).not.toHaveProperty("review");
    expect(schema).not.toHaveProperty("foundingDate");
    expect(schema).not.toHaveProperty("numberOfEmployees");
  });

  it("WebSite references the Organization by @id rather than repeating it", () => {
    const schema = buildWebSiteSchema(config);
    expect(schema.publisher).toEqual({ "@id": organizationId(config.url) });
  });
});

describe("Service / CaseStudy schema", () => {
  it("Service references the org by @id and includes no fabricated ratings", () => {
    const schema = buildServiceSchema({ name: "Web Development", description: "Custom sites.", url: `${config.url}/en/services/web-development` });
    expect(schema["@type"]).toBe("Service");
    expect(schema.provider).toEqual({ "@id": organizationId() });
  });

  it("uses CreativeWork for a case study, not SoftwareApplication", () => {
    const schema = buildCaseStudySchema({ name: "SahEat", description: "A delivery marketplace.", url: `${config.url}/en/work/saheat` });
    expect(schema["@type"]).toBe("CreativeWork");
  });
});

describe("FAQPage / BreadcrumbList schema", () => {
  it("maps each FAQ item to a Question/Answer pair", () => {
    const schema = buildFaqPageSchema([{ question: "Q1?", answer: "A1." }]);
    expect(schema.mainEntity).toEqual([{ "@type": "Question", name: "Q1?", acceptedAnswer: { "@type": "Answer", text: "A1." } }]);
  });

  it("numbers breadcrumb positions starting at 1", () => {
    const schema = buildBreadcrumbListSchema([{ name: "Home", url: "https://x/en" }, { name: "Services" }]);
    expect(schema.itemListElement[0]).toMatchObject({ position: 1, name: "Home", item: "https://x/en" });
    expect(schema.itemListElement[1]).toMatchObject({ position: 2, name: "Services" });
    expect(schema.itemListElement[1]).not.toHaveProperty("item");
  });
});

describe("withSchemaContext", () => {
  it("wraps a single node with @context", () => {
    expect(withSchemaContext({ "@type": "Thing" })).toEqual({ "@context": "https://schema.org", "@type": "Thing" });
  });

  it("wraps an array as a @graph", () => {
    expect(withSchemaContext([{ "@type": "A" }, { "@type": "B" }])).toEqual({
      "@context": "https://schema.org",
      "@graph": [{ "@type": "A" }, { "@type": "B" }],
    });
  });
});
