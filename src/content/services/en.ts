import type { LocalizedServiceContentMap } from "@/domain/service";

export const servicesEn: LocalizedServiceContentMap = {
  "web-development": {
    slug: "web-development",
    title: "Web Development",
    positioning: "Custom websites and web apps, fast and built to convert.",
    description:
      "We design and build marketing sites, business platforms, and web applications with Next.js and React — from first wireframe to production, with performance and SEO treated as technical decisions, not afterthoughts.",
    problems: [
      "A slow or dated website that no longer reflects your business",
      "A generic theme that's impossible to extend",
      "A site that's invisible on Google for lack of a solid technical base",
    ],
    deliverables: [
      "Custom website or web app, source code included",
      "Responsive design optimized for mobile and desktop",
      "SEO-ready technical structure",
      "Forms and integrations connected to your tools",
    ],
    capabilities: [
      "Marketing sites and business platforms",
      "Internal web applications (dashboards, tools)",
      "API and third-party service integration",
      "Migration from an old site or CMS",
    ],
    industries: ["Professional services", "Real estate", "Healthcare", "Education"],
    faq: [
      {
        question: "How long does building a website take?",
        answer:
          "A marketing site typically takes 2 to 4 weeks. A more complex platform depends on the scope we define together upfront.",
      },
      {
        question: "Will the site be optimized for SEO?",
        answer: "Yes — technical structure, metadata, and performance are designed in from the start, not bolted on afterward.",
      },
      {
        question: "Can I edit the content myself after launch?",
        answer:
          "Depending on the project, we set up a simple editing interface, or handle updates for you under a maintenance plan.",
      },
    ],
  },
  "mobile-applications": {
    slug: "mobile-applications",
    title: "Mobile Applications",
    positioning: "iOS and Android apps built around your users, from prototype to the store.",
    description:
      "We build native or cross-platform mobile apps with React Native, from the first user flow through publishing on the App Store and Google Play.",
    problems: [
      "An app idea with no clarity on feasibility or cost",
      "A need to cover iOS and Android without doubling the budget",
      "An existing app that's slow, buggy, or hard to evolve",
    ],
    deliverables: [
      "iOS and Android app from a single codebase",
      "User flow and interface designed for mobile use",
      "Store publishing and configuration",
      "Connection to your existing backend or API",
    ],
    capabilities: [
      "Consumer apps and business apps",
      "Push notifications and offline functionality",
      "Authentication and user account management",
      "Payment, geolocation, and camera integration",
    ],
    industries: ["Delivery & marketplace", "Retail", "Local services"],
    faq: [
      {
        question: "Do I need a separate app for iOS and Android?",
        answer:
          "No — we use React Native to ship a single codebase that covers both platforms, unless a specific technical need calls for pure native.",
      },
      {
        question: "How much does a mobile app cost?",
        answer:
          "It depends on the number of screens, features, and integrations needed. We provide a quote after scoping the project with you.",
      },
      {
        question: "Do you handle store submission?",
        answer: "Yes, we manage configuration and submission on the App Store and Google Play.",
      },
    ],
  },
  ecommerce: {
    slug: "ecommerce",
    title: "E-commerce",
    positioning: "Full online stores, from catalog to checkout, built to sell.",
    description:
      "We build custom online stores: product catalog, cart, secure checkout, and inventory management — with close attention to load speed and the purchase funnel.",
    problems: [
      "A generic e-commerce theme that doesn't fit your catalog",
      "A checkout flow long enough to lose sales",
      "Manual, error-prone inventory management",
    ],
    deliverables: [
      "Custom online store with secure checkout",
      "Inventory and order management",
      "Product pages optimized for conversion and SEO",
      "Sales tracking dashboard",
    ],
    capabilities: [
      "Online payment and cash-on-delivery",
      "Multi-product and variant management",
      "Logistics and delivery integration",
      "Customer accounts and order history",
    ],
    industries: ["Fashion & accessories", "Beauty", "Equipment", "Food"],
    faq: [
      {
        question: "Is cash on delivery possible?",
        answer:
          "Yes, we can integrate cash on delivery alongside online payment, matching how the Algerian market actually buys.",
      },
      {
        question: "Can I manage my own product catalog?",
        answer: "Yes — you get an interface to add, edit, and organize products without depending on a developer.",
      },
      {
        question: "Will the store work well on mobile?",
        answer: "Yes — since most shoppers browse from a phone, every store is designed mobile-first from day one.",
      },
    ],
  },
  "saas-platforms": {
    slug: "saas-platforms",
    title: "SaaS & Platforms",
    positioning: "SaaS products and business tools designed to scale with you.",
    description:
      "We design SaaS platforms and custom business tools — subscriptions, multi-user workspaces, dashboards — with an architecture built for growth from day one.",
    problems: [
      "A business process still run manually through spreadsheets",
      "A SaaS product idea with no clear technical architecture yet",
      "An internal tool that's become too rigid for the team",
    ],
    deliverables: [
      "Web platform with user accounts and roles",
      "Documented, scalable technical architecture",
      "Admin dashboard",
      "Subscription or billing system where needed",
    ],
    capabilities: [
      "Multi-tenancy and permission management",
      "Dashboards and reporting",
      "Recurring billing and subscriptions",
      "API for connecting other tools",
    ],
    industries: ["Internal business tools", "Marketplaces", "Booking & management"],
    faq: [
      {
        question: "What sets a SaaS product apart from a regular website?",
        answer:
          "A SaaS product manages user accounts, roles, and often billing, and needs to support a growing user base — the technical architecture matters more from the start.",
      },
      {
        question: "Can you start with a minimal version (MVP)?",
        answer: "Yes, that's the approach we recommend to validate the product before investing in advanced features.",
      },
      {
        question: "Can the product grow later?",
        answer: "Yes — the architecture is documented and modular so features can be added without rebuilding everything.",
      },
    ],
  },
  "ai-agents": {
    slug: "ai-agents",
    title: "AI Agents",
    positioning: "AI agents and assistants that understand your customers and qualify their requests.",
    description:
      "We build AI agents that can answer customers, qualify a request, or guide a visitor to the right solution — in French, Arabic, or English — connected to your real data and business tools.",
    problems: [
      "A team overwhelmed by repetitive questions",
      "Visitors leaving without finding an answer",
      "A need to qualify incoming requests before handing them to a human",
    ],
    deliverables: [
      "Conversational agent connected to your content and tools",
      "Multilingual support (French, Arabic, English)",
      "Automatic qualification of incoming requests",
      "Architecture independent of any single AI provider",
    ],
    capabilities: [
      "On-site consultative assistant",
      "Lead qualification before human handoff",
      "Answers grounded in your real documents and data",
      "Smooth handoff to WhatsApp or a human",
    ],
    industries: ["Customer service", "Real estate", "Tourism & travel"],
    faq: [
      {
        question: "Does an AI agent replace my team?",
        answer:
          "No — it handles repetitive questions and qualifies requests, so your team can focus on the conversations that actually need a human.",
      },
      {
        question: "Can the AI get things wrong?",
        answer: "Yes, like any AI system. We design agents to be honest about their limits and hand off to a human when needed.",
      },
      {
        question: "Can I switch AI providers later?",
        answer: "Yes, the architecture is built to avoid locking you into a single AI model provider.",
      },
    ],
  },
  "voice-ai": {
    slug: "voice-ai",
    title: "Voice AI",
    positioning: "Voice assistants that understand and respond naturally to your callers.",
    description:
      "We build voice AI solutions to handle incoming calls, take bookings, or answer frequent questions, with natural understanding of French, Arabic, or English.",
    problems: [
      "Missed calls outside business hours",
      "A phone line overwhelmed by repetitive questions",
      "A need for automated appointment booking",
    ],
    deliverables: [
      "Voice assistant connected to your phone line",
      "Automated booking or order taking",
      "Call transcription and summaries",
      "Handoff to a human when needed",
    ],
    capabilities: [
      "Answering frequent questions by phone",
      "Appointment booking and reminders",
      "Multilingual voice understanding",
      "Integration with your calendar or booking system",
    ],
    industries: ["Restaurants & bookings", "Healthcare", "Home services"],
    faq: [
      {
        question: "Does the voice assistant understand Algerian Darija?",
        answer:
          "Understanding of Darija depends on the voice provider chosen and the project's scope — we discuss this upfront to set realistic expectations.",
      },
      {
        question: "Can a call be handed off to a real person?",
        answer: "Yes, handoff to a human is designed in from the start for cases the assistant can't handle alone.",
      },
    ],
  },
  automation: {
    slug: "automation",
    title: "Automation",
    positioning: "Automations that remove repetitive work from your team's day.",
    description:
      "We automate manual, repetitive tasks across your tools — orders, notifications, data updates — so your team spends less time on data entry and more on what matters.",
    problems: [
      "Data re-entered by hand across multiple tools",
      "Notifications or follow-ups managed manually",
      "A business process that depends on one specific person",
    ],
    deliverables: [
      "Automation connecting your existing tools",
      "Automatic notifications and alerts",
      "Clear documentation of how it works",
      "Error and execution tracking",
    ],
    capabilities: [
      "Syncing between apps (CRM, spreadsheets, WhatsApp)",
      "Automatic email or WhatsApp notifications",
      "Automatic document generation",
      "Custom business workflows",
    ],
    industries: ["Retail", "Administrative services", "Logistics"],
    faq: [
      {
        question: "Do we need to replace our current tools?",
        answer: "Usually no — automation connects the tools you already use rather than replacing them.",
      },
      {
        question: "What happens if an automation fails?",
        answer: "We set up error tracking so a failure is visible and handled quickly, not silent.",
      },
    ],
  },
  "ui-ux-design": {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    positioning: "Clear interfaces that build trust and guide people to act.",
    description:
      "We design interfaces around your real users — clear flows, visual hierarchy, and a consistent design system — before a single line of code gets written.",
    problems: [
      "A confusing interface that discourages visitors",
      "Visual identity that's inconsistent from page to page",
      "A product that works but that nobody finds easy to understand",
    ],
    deliverables: [
      "High-fidelity mockups of key screens",
      "Reusable design system (colors, typography, components)",
      "User flows clarified before development",
      "Organized Figma files, handed over to you",
    ],
    capabilities: [
      "Web and mobile interface design",
      "Design systems for product teams",
      "Redesign of existing interfaces",
      "Interactive prototypes for user testing",
    ],
    industries: ["SaaS products", "Mobile apps", "E-commerce sites"],
    faq: [
      {
        question: "Does design always come before development?",
        answer: "In most projects, yes — it avoids costly back-and-forth once code has been written.",
      },
      {
        question: "Do you provide the source files?",
        answer: "Yes, you receive organized Figma files, not just image exports.",
      },
    ],
  },
  "seo-growth": {
    slug: "seo-growth",
    title: "SEO & Growth",
    positioning: "A solid technical foundation to be found — without unrealistic ranking promises.",
    description:
      "We set up the technical foundations of SEO — structure, metadata, performance, structured data — and honest results tracking, without resorting to practices that put your site at risk.",
    problems: [
      "A site invisible on searches related to your business",
      "Missing or duplicate metadata",
      "A slow site that hurts both ranking and user experience",
    ],
    deliverables: [
      "Full technical SEO audit",
      "Correct metadata, structured data, and sitemap",
      "Performance optimization (Core Web Vitals)",
      "Reporting based on real data",
    ],
    capabilities: [
      "Technical SEO (structure, speed, indexing)",
      "Content optimized for search intent",
      "Ranking and traffic tracking",
      "Multilingual SEO (hreflang, localized content)",
    ],
    industries: ["Marketing sites", "E-commerce", "Content platforms"],
    faq: [
      {
        question: "Can you guarantee the #1 spot on Google?",
        answer: "No, and we'd be wary of anyone who promises that. We build a healthy technical foundation and track results honestly.",
      },
      {
        question: "How long before I see results?",
        answer: "SEO is a long-term effort — technical gains come quickly, but durable growth takes several months.",
      },
    ],
  },
  "backend-api": {
    slug: "backend-api",
    title: "Backend & API",
    positioning: "Solid, secure server foundations, ready to scale.",
    description:
      "We build the server logic, databases, and APIs that make your applications run reliably — with close attention to security and data quality.",
    problems: [
      "A front-end application with no solid server logic behind it",
      "Poorly structured data that makes every change harder",
      "A need to expose your data to other systems securely",
    ],
    deliverables: [
      "Secure, documented API",
      "Structured, optimized database",
      "Input validation at every entry point",
      "Logging and error handling",
    ],
    capabilities: [
      "Database design",
      "REST and GraphQL APIs",
      "Authentication and permission management",
      "Third-party service integration",
    ],
    industries: ["SaaS platforms", "Mobile apps", "Internal systems"],
    faq: [
      {
        question: "Can you work with an existing database?",
        answer: "Yes, we can take over an existing database after an audit, or design a new one depending on the project.",
      },
      {
        question: "How is security handled?",
        answer: "Input validation, authentication, and permissions are designed into the architecture, not bolted on at the end.",
      },
    ],
  },
  "cloud-infrastructure": {
    slug: "cloud-infrastructure",
    title: "Cloud & Infrastructure",
    positioning: "Reliable infrastructure that doesn't lock you into a single provider.",
    description:
      "We set up hosting, continuous deployment, and monitoring for your applications, with an architecture that stays portable rather than tied to one provider.",
    problems: [
      "Manual deployment that's error-prone and causes downtime",
      "Infrastructure too dependent on a single provider",
      "No visibility when something goes down or slows",
    ],
    deliverables: [
      "Automated, secure deployment",
      "Monitoring and incident alerts",
      "Automatic data backups",
      "Infrastructure documentation",
    ],
    capabilities: [
      "Hosting and continuous deployment",
      "Performance and error monitoring",
      "Portable architecture (not locked to one cloud)",
      "Backups and recovery plans",
    ],
    industries: ["SaaS platforms", "High-traffic applications", "Critical systems"],
    faq: [
      {
        question: "Are we locked into a specific cloud provider?",
        answer: "No, we design the architecture to stay portable and avoid single-provider lock-in.",
      },
      {
        question: "What happens if something goes down?",
        answer: "Monitoring in place catches an incident quickly, so it can be addressed before it lastingly affects your users.",
      },
    ],
  },
  "maintenance-support": {
    slug: "maintenance-support",
    title: "Maintenance & Support",
    positioning: "A website or app that stays reliable, secure, and up to date over time.",
    description:
      "We handle the technical maintenance of your site or application after launch — security updates, fixes, small improvements — so what we delivered stays reliable long-term.",
    problems: [
      "A site left unmaintained after launch",
      "Security updates that never get applied",
      "No technical point of contact when something breaks",
    ],
    deliverables: [
      "Regular security updates",
      "Bug fixes and small improvements",
      "Uptime monitoring",
      "Periodic activity report",
    ],
    capabilities: [
      "Corrective and evolutive maintenance",
      "Security and performance monitoring",
      "Regular backups",
      "Responsive technical support",
    ],
    industries: ["Marketing sites", "E-commerce", "Business applications"],
    faq: [
      {
        question: "Is maintenance mandatory after a project?",
        answer: "No, but it's strongly recommended for anything public-facing, to avoid unpatched security issues.",
      },
      {
        question: "Can I request small improvements under a maintenance plan?",
        answer: "Yes, maintenance plans typically include a volume of minor changes — the details are agreed together.",
      },
    ],
  },
};
