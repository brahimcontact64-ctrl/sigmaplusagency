import { describe, it, expect, beforeAll, vi } from "vitest";

// Same rationale as tests/integration/lead-service.test.ts — see that
// file's comment. submitProjectRequest (via buildStructuredBrief) needs
// this mocked outside Next's own runtime.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = (key: string) => key;
    return t;
  },
}));

import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestLeadRepository, type LeadRepository } from "@/lib/repositories/lead-repository";
import { createTestAiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { submitProjectRequest } from "@/lib/services/lead-service";
import { qualificationToSubmitInput } from "@/lib/ai/qualification-to-project-request";
import { EMPTY_QUALIFICATION_STATE, mergeInferredQualification, hasMinimalQualification } from "@/domain/ai-qualification";

let db: AppDatabase;
let leadRepo: LeadRepository;

beforeAll(async () => {
  db = await createTestDb();
  leadRepo = createTestLeadRepository(async () => db);
});

describe("AI consultation → real CRM lead (end-to-end through the actual LeadService)", () => {
  it("turns a qualified AI conversation into a real lead + project request, never bypassing lead-service", async () => {
    const state = mergeInferredQualification(
      EMPTY_QUALIFICATION_STATE,
      { projectType: "ecommerce", goals: ["sell-products"], platforms: ["web"] },
      "msg-1",
    );
    expect(hasMinimalQualification(state)).toBe(true);

    const submitInput = qualificationToSubmitInput(state, { name: "AI Handoff Client", email: "ai-handoff@example.com" }, "en", {});
    const result = await submitProjectRequest(submitInput, leadRepo);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.reference).toMatch(/^SP-/);

    const conversationRepo = createTestAiConversationRepository(async () => db);
    const conversation = await conversationRepo.create("ai-handoff-session", "en");
    await conversationRepo.linkLead(conversation.id, result.leadId);
    await leadRepo.createActivity(result.leadId, "ai_lead_created", { via: "ai_consultant" });

    const linked = await conversationRepo.findByLeadId(result.leadId);
    expect(linked?.id).toBe(conversation.id);
    expect(linked?.status).toBe("converted");
  });

  it("still creates a lead with honest defaults when the AI gathered almost nothing", async () => {
    const submitInput = qualificationToSubmitInput(EMPTY_QUALIFICATION_STATE, { name: "Minimal Info Client", email: "minimal@example.com" }, "en", {});
    const result = await submitProjectRequest(submitInput, leadRepo);
    expect(result.success).toBe(true);
  });
});
