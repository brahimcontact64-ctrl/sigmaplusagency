import { describe, it, expect, beforeAll, vi } from "vitest";

// Same pragmatic mock as lead-service.test.ts — buildStructuredBrief
// needs next-intl/server's getTranslations, unavailable outside a real
// Next.js runtime.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = (key: string) => key;
    return t;
  },
}));

import { eq } from "drizzle-orm";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { submitContact, submitProjectRequest } from "@/lib/services/lead-service";
import { normalizeEmail, normalizePhone } from "@/lib/services/identity";
import { leads, leadActivities } from "@/lib/db/schema";

let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

function repo() {
  return createTestLeadRepository(async () => db);
}

async function findLead(id: string) {
  const [row] = await db.select().from(leads).where(eq(leads.id, id));
  return row;
}

async function submitPB(overrides: { name: string; email?: string; phone?: string }) {
  const result = await submitProjectRequest(
    {
      projectType: "website",
      goals: [],
      capabilities: [],
      platforms: [],
      businessState: "new-idea",
      timeline: "asap",
      budgetRange: "not-sure",
      message: "Identity model test submission.",
      locale: "fr",
      ...overrides,
    },
    repo(),
  );
  if (!result.success) throw new Error("submission failed");
  return result;
}

describe("Lead identity / dedup model — phone-first, email fallback", () => {
  it("normalized phone dedup: two submissions with the same phone in different formats reuse one lead", async () => {
    // Same real number, two differently-formatted (but equally
    // international, i.e. no local-vs-+country ambiguity) representations.
    const first = await submitPB({ name: "Phone Dedup A", phone: "+213 550 47 62 48" });
    const second = await submitPB({ name: "Phone Dedup A Again", phone: "00213550476248" }); // "00" intl prefix, no spaces

    expect(normalizePhone("+213 550 47 62 48")).toBe(normalizePhone("00213550476248"));
    expect(second.leadId).toBe(first.leadId);
  });

  it("repeated phone submission does not create a duplicate lead", async () => {
    const phone = "0550101010";
    const first = await submitPB({ name: "Repeat Phone", phone });
    const second = await submitPB({ name: "Repeat Phone Again", phone });
    const third = await submitPB({ name: "Repeat Phone Third Time", phone });

    expect(second.leadId).toBe(first.leadId);
    expect(third.leadId).toBe(first.leadId);

    const matching = (await db.select().from(leads)).filter((l) => l.phoneNormalized === normalizePhone(phone));
    expect(matching).toHaveLength(1);
  });

  it("email fallback dedup: with no phone supplied, a repeat email still reuses the same lead", async () => {
    const first = await submitPB({ name: "Email Fallback", email: "email-fallback@example.com" });
    const second = await submitPB({ name: "Email Fallback Again", email: "EMAIL-FALLBACK@example.com" });

    expect(second.leadId).toBe(first.leadId);
  });

  it("existing email-only lead (legacy shape, pre-dating phone-first dedup) continues to dedup correctly by email", async () => {
    // Simulate a lead created the old way, directly via the repository,
    // exactly as every lead looked before this change: email present,
    // no phone at all.
    const legacyLead = await repo().createLead({
      publicReference: "SP-LEGACY",
      name: "Legacy Email Lead",
      email: "legacy@example.com",
      emailNormalized: normalizeEmail("legacy@example.com"),
      language: "fr",
      source: "contact_form",
    });

    const resubmission = await submitPB({ name: "Legacy Email Lead Returning", email: "legacy@example.com" });
    expect(resubmission.leadId).toBe(legacyLead.id);
  });

  it("phone match does not get overwritten by a missing email on a later submission", async () => {
    const phone = "0550202020";
    const first = await submitPB({ name: "Has Email First", email: "has-email@example.com", phone });
    const second = await submitPB({ name: "No Email Second Time", phone }); // same phone, no email this time

    expect(second.leadId).toBe(first.leadId);
    const lead = await findLead(first.leadId);
    // The previously-known email must survive a later submission that simply didn't repeat it.
    expect(lead?.email).toBe("has-email@example.com");
  });

  it("email match can safely gain a previously-missing phone", async () => {
    const first = await submitPB({ name: "Email Only First", email: "gains-phone@example.com" });
    const second = await submitPB({ name: "Email Only Adds Phone", email: "gains-phone@example.com", phone: "0550303030" });

    expect(second.leadId).toBe(first.leadId);
    const lead = await findLead(first.leadId);
    expect(lead?.phone).toBe("0550303030");
  });

  it("phone match can safely gain a previously-missing email", async () => {
    const phone = "0550404040";
    const first = await submitPB({ name: "Phone Only First", phone });
    const second = await submitPB({ name: "Phone Only Adds Email", phone, email: "gains-email@example.com" });

    expect(second.leadId).toBe(first.leadId);
    const lead = await findLead(first.leadId);
    expect(lead?.email).toBe("gains-email@example.com");
  });

  it("conflicting phone/email identities do NOT silently merge two different leads", async () => {
    // Lead A: phone only. Lead B: a DIFFERENT, unrelated email only.
    const leadA = await submitPB({ name: "Lead A", phone: "0550505050" });
    const leadB = await submitPB({ name: "Lead B", email: "lead-b@example.com" });
    expect(leadA.leadId).not.toBe(leadB.leadId);

    // A third submission uses Lead A's phone AND Lead B's email together.
    // Phone priority means this must resolve to Lead A — Lead B must
    // never be read, touched, or merged.
    const third = await submitPB({ name: "Conflicting Submission", phone: "0550505050", email: "lead-b@example.com" });
    expect(third.leadId).toBe(leadA.leadId);
    expect(third.leadId).not.toBe(leadB.leadId);

    // Lead A must NOT have gained "lead-b@example.com" as its email —
    // that email already identifies a different, existing lead (B), so
    // attributing it to A too would let two rows share one identity
    // signal. Lead A's email stays exactly what it was (nothing).
    const refreshedA = await findLead(leadA.leadId);
    expect(refreshedA?.email).toBeNull();

    // Lead B must be completely untouched — no phone attributed to it.
    const refreshedB = await findLead(leadB.leadId);
    expect(refreshedB?.phone).toBeNull();

    // No new (third) lead was created for the conflicting submission.
    const allLeadNames = (await db.select().from(leads)).map((l) => l.name);
    expect(allLeadNames.filter((n) => n === "Conflicting Submission")).toHaveLength(0);
  });

  it("records a non-PII identity_conflict_detected activity on the reused lead — never the raw phone/email, never on the other lead", async () => {
    const leadA = await submitPB({ name: "Signal Lead A", phone: "0550707070" });
    const leadB = await submitPB({ name: "Signal Lead B", email: "signal-lead-b@example.com" });

    await submitPB({ name: "Signal Conflicting Submission", phone: "0550707070", email: "signal-lead-b@example.com" });

    const activitiesForA = await db.select().from(leadActivities).where(eq(leadActivities.leadId, leadA.leadId));
    const conflictActivities = activitiesForA.filter((a) => a.type === "identity_conflict_detected");
    expect(conflictActivities).toHaveLength(1);

    const metadata = conflictActivities[0]!.metadata as Record<string, unknown>;
    expect(metadata).toEqual({
      source: "project_builder",
      hasPhoneConflict: false,
      hasEmailConflict: true,
    });

    // Defense-in-depth: the raw conflicting values must never appear
    // anywhere in the stored activity, under any key.
    const serialized = JSON.stringify(conflictActivities[0]);
    expect(serialized).not.toContain("signal-lead-b@example.com");
    expect(serialized).not.toContain("0550707070");

    // Lead B must never receive this signal — it was never touched.
    const activitiesForB = await db.select().from(leadActivities).where(eq(leadActivities.leadId, leadB.leadId));
    expect(activitiesForB.some((a) => a.type === "identity_conflict_detected")).toBe(false);
  });

  it("does NOT record a conflict signal for an ordinary, non-conflicting submission", async () => {
    const lead = await submitPB({ name: "No Conflict Person", phone: "0550808080", email: "no-conflict@example.com" });

    const activities = await db.select().from(leadActivities).where(eq(leadActivities.leadId, lead.leadId));
    expect(activities.some((a) => a.type === "identity_conflict_detected")).toBe(false);
  });

  it("Contact form (always-email) submissions share the exact same identity model — a matching phone still takes priority", async () => {
    const phone = "0550606060";
    const viaBuilder = await submitPB({ name: "Cross-Surface Person", phone });

    const viaContact = await submitContact(
      { name: "Cross-Surface Person Via Contact", email: "cross-surface@example.com", phone, message: "Following up via the contact form.", locale: "fr" },
      repo(),
    );

    expect(viaContact.success).toBe(true);
    if (!viaContact.success) return;
    // Same phone → same lead, even though this call supplied an email
    // and the original Project Builder submission didn't.
    expect(viaContact.leadId).toBe(viaBuilder.leadId);

    const lead = await findLead(viaBuilder.leadId);
    expect(lead?.email).toBe("cross-surface@example.com");
  });
});
