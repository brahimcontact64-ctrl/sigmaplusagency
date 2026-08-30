import type { LocalizedCaseStudyContentMap } from "@/domain/case-study";

export const caseStudiesEn: LocalizedCaseStudyContentMap = {
  saheat: {
    slug: "saheat",
    name: "SahEat",
    tag: "Marketplace",
    tagline: "Food delivery marketplace",
    summary:
      "A food delivery marketplace built with mobile apps for end users and an admin dashboard for operations.",
    whatItIs:
      "SahEat connects restaurants and end users for food ordering and delivery, with an admin space to manage orders and partners.",
    coreFunctionality: [
      "Mobile app for food ordering",
      "Admin dashboard for order management",
      "Partner restaurant management",
    ],
    narrative: {},
  },
  "e-vizza": {
    slug: "e-vizza",
    name: "e-Vizza",
    tag: "SaaS · AI",
    tagline: "AI-assisted SaaS visa automation platform",
    summary: "A SaaS platform that automates part of the visa application process using AI.",
    whatItIs: "e-Vizza is a SaaS product focused on simplifying and automating the visa application process for its users.",
    coreFunctionality: ["AI-assisted automation of the application process", "Web platform for end users"],
    narrative: {},
  },
  "eleman-shoes": {
    slug: "eleman-shoes",
    name: "Eleman Shoes",
    tag: "E-commerce",
    tagline: "E-commerce store with inventory management",
    summary: "An e-commerce store with real-time inventory management for selling shoes online.",
    whatItIs: "Eleman Shoes is an online store dedicated to selling shoes, with built-in inventory tracking.",
    coreFunctionality: ["Product catalog and online sales", "Real-time inventory management"],
    narrative: {},
  },
  dzenix: {
    slug: "dzenix",
    name: "Dzenix",
    tag: "Site & brand",
    tagline: "Website and brand identity",
    summary: "A website and brand identity designed for a digital agency.",
    whatItIs: "Dzenix is the website and visual identity of a digital agency.",
    coreFunctionality: ["Marketing website", "Brand identity"],
    narrative: {},
  },
};
