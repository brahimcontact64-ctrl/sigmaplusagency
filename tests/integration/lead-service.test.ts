import { describe, it, expect, beforeAll, vi } from "vitest";

// next-intl's server functions resolve to a "react-server"-conditioned
// build that transitively imports next/headers — a module Next.js's own
// bundler resolves specially and that no generic test runner replicates
// outside of it. Mocking the one function structured-brief.ts calls is
// the standard, pragmatic way to test this logic in isolation; the real
// translation behavior (correct French/English/German/Arabic labels) is
// separately verified via the actual Next.js dev server in Phase 4's
// manual E2E pass (see the master plan's Phase 4 report).
vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = (key: string) => key;
    return t;
  },
}));

import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { submitContact, submitProjectRequest } from "@/lib/services/lead-service";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail, normalizePhone } from "@/lib/services/identity";
import { leads, projectRequests, leadActivities } from "@/lib/db/schema";

// One isolated, in-memory Postgres instance (via PGlite) for this whole
// file — real SQL, real constraints, never touching the dev database or
// a shared test fixture that could leak state between test files.
let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

function repo() {
  return createTestLeadRepository(async () => db);
}

describe("submitContact", () => {
  it("creates a new lead on first submission", async () => {
    const result = await submitContact(
      {
        name: "Amine Test",
        email: "amine.test@example.com",
        message: "I need a website for my restaurant.",
        locale: "fr",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.reference).toMatch(/^SP-[A-Z0-9]{6}$/);

    const rows = await db.select().from(leads);
    const created = rows.find((r) => r.id === result.leadId);
    expect(created?.email).toBe("amine.test@example.com");
    expect(created?.status).toBe("NEW");
    expect(created?.source).toBe("contact_form");
  });

  it("records a lead_created activity for a brand-new lead", async () => {
    const result = await submitContact(
      { name: "Second Person", email: "second@example.com", message: "Hello there, need an app.", locale: "en" },
      repo(),
    );
    expect(result.success).toBe(true);
    if (!result.success) return;

    const activities = await db.select().from(leadActivities);
    const forThisLead = activities.filter((a) => a.leadId === result.leadId);
    expect(forThisLead.some((a) => a.type === "lead_created")).toBe(true);
    expect(forThisLead.some((a) => a.type === "contact_form_submitted")).toBe(true);
  });

  it("does not create a duplicate lead for a repeat email — associates a new activity instead", async () => {
    const first = await submitContact(
      { name: "Repeat Person", email: "repeat@example.com", message: "First message here please.", locale: "fr" },
      repo(),
    );
    const second = await submitContact(
      {
        name: "Repeat Person Again",
        email: "REPEAT@example.com", // different casing — normalization should still match
        message: "Second message, following up on my request.",
        locale: "fr",
      },
      repo(),
    );

    expect(first.success && second.success).toBe(true);
    if (!first.success || !second.success) return;
    expect(second.leadId).toBe(first.leadId);
    expect(second.reference).toBe(first.reference);

    const allLeadsWithEmail = (await db.select().from(leads)).filter(
      (l) => l.emailNormalized === "repeat@example.com",
    );
    expect(allLeadsWithEmail).toHaveLength(1);
  });
});

describe("submitProjectRequest", () => {
  it("creates a lead, a project request, and a structured brief", async () => {
    const result = await submitProjectRequest(
      {
        projectType: "ecommerce",
        goals: ["sell-products"],
        capabilities: ["payments", "inventory"],
        platforms: ["web"],
        businessState: "new-idea",
        timeline: "asap",
        budgetRange: "1000-5000",
        name: "Store Owner",
        email: "store-owner@example.com",
        locale: "en",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.brief.projectType).toBeTruthy();
    expect(result.brief.primaryGoals.length).toBe(1);

    const requests = await db.select().from(projectRequests);
    const created = requests.find((r) => r.leadId === result.leadId);
    expect(created?.projectType).toBe("ecommerce");
    expect(created?.goals).toEqual(["sell-products"]);
    expect(created?.structuredBrief).toBeTruthy();
  });

  it("Project Builder v2 short-form request: persists empty goals/capabilities/platforms rather than fabricating a value", async () => {
    const result = await submitProjectRequest(
      {
        projectType: "website",
        goals: [],
        capabilities: [],
        platforms: [],
        businessState: "new-idea",
        timeline: "asap",
        budgetRange: "not-sure",
        name: "Short Form Person",
        email: "short-form@example.com",
        phone: "0550111222",
        message: "I need a simple website for my new bakery.",
        locale: "fr",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    const requests = await db.select().from(projectRequests);
    const created = requests.find((r) => r.id === result.projectRequestId);
    // Never a guessed default like ["web"] — a genuinely empty array is
    // the correct representation of "not asked in the short-form flow".
    expect(created?.goals).toEqual([]);
    expect(created?.capabilities).toEqual([]);
    expect(created?.platforms).toEqual([]);
    expect(created?.message).toBe("I need a simple website for my new bakery.");
    // An empty-goals brief should flag it as an open question for the sales team.
    expect(result.brief.openQuestions.length).toBeGreaterThan(0);
  });

  it("stays backward compatible with a fully-specified legacy-shaped submission (e.g. an AI Consultant handoff)", async () => {
    const result = await submitProjectRequest(
      {
        projectType: "saas-platform",
        goals: ["launch-mvp", "automate-operations"],
        capabilities: ["authentication", "admin-dashboard"],
        platforms: ["web", "ios"],
        businessState: "existing-business",
        currentWebsite: "https://example.com",
        timeline: "3-6-months",
        budgetRange: "15000-plus",
        name: "Legacy Shape Person",
        email: "legacy-shape@example.com",
        phone: "0550333444",
        message: "Full detail supplied all at once, as the AI Consultant handoff would.",
        locale: "en",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    const requests = await db.select().from(projectRequests);
    const created = requests.find((r) => r.id === result.projectRequestId);
    expect(created?.goals).toEqual(["launch-mvp", "automate-operations"]);
    expect(created?.platforms).toEqual(["web", "ios"]);
    expect(created?.currentWebsite).toBe("https://example.com");
  });

  it("phone + no email succeeds and persists email as NULL, never an empty string or a fabricated value", async () => {
    const result = await submitProjectRequest(
      {
        projectType: "website",
        goals: [],
        capabilities: [],
        platforms: [],
        businessState: "new-idea",
        timeline: "asap",
        budgetRange: "not-sure",
        name: "Phone Only Person",
        phone: "0550999888",
        message: "I need a website but prefer WhatsApp only.",
        locale: "fr",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    const rows = await db.select().from(leads);
    const created = rows.find((r) => r.id === result.leadId);
    expect(created?.email).toBeNull();
    expect(created?.emailNormalized).toBeNull();
    expect(created?.phone).toBe("0550999888");
  });

  it("phone + a valid email both succeed and are both persisted", async () => {
    const result = await submitProjectRequest(
      {
        projectType: "website",
        goals: [],
        capabilities: [],
        platforms: [],
        businessState: "new-idea",
        timeline: "asap",
        budgetRange: "not-sure",
        name: "Both Provided Person",
        email: "both-provided@example.com",
        phone: "0550999777",
        message: "I need a website, either channel works.",
        locale: "fr",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    const rows = await db.select().from(leads);
    const created = rows.find((r) => r.id === result.leadId);
    expect(created?.email).toBe("both-provided@example.com");
    expect(created?.phone).toBe("0550999777");
  });

  it("flags an open question when platform is unclear", async () => {
    const result = await submitProjectRequest(
      {
        projectType: "not-sure",
        goals: ["other"],
        capabilities: [],
        platforms: ["not-sure"],
        businessState: "new-idea",
        timeline: "flexible",
        budgetRange: "not-sure",
        name: "Unsure Person",
        email: "unsure@example.com",
        locale: "en",
      },
      repo(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.brief.openQuestions.length).toBeGreaterThan(0);
  });
});

describe("generatePublicReference", () => {
  it("produces a short, human-readable, non-sequential reference", () => {
    const refs = new Set(Array.from({ length: 50 }, () => generatePublicReference()));
    expect(refs.size).toBe(50); // no collisions across 50 generations
    for (const ref of refs) {
      expect(ref).toMatch(/^SP-[A-Z0-9]{6}$/);
      // ambiguous characters (0, O, 1, I, L) must never appear
      expect(ref).not.toMatch(/[01IOL]/);
    }
  });
});

describe("identity normalization", () => {
  it("normalizes email case", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("normalizes phone formatting while preserving a leading +", () => {
    expect(normalizePhone("+213 550 47 52 48")).toBe("+213550475248");
    expect(normalizePhone("0550-47-52-48")).toBe("0550475248");
  });
});

describe("repository failure handling", () => {
  it("returns a typed failure instead of throwing when the repository errors", async () => {
    const brokenRepo = createTestLeadRepository(async () => {
      throw new Error("simulated connection failure — ECONNREFUSED");
    });

    const result = await submitContact(
      { name: "Doomed", email: "doomed@example.com", message: "This should fail gracefully please.", locale: "fr" },
      brokenRepo,
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("db_unavailable");
  });
});
