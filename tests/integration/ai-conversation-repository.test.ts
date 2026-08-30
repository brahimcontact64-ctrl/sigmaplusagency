import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestAiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { createTestLeadRepository } from "@/lib/repositories/lead-repository";
import { EMPTY_QUALIFICATION_STATE } from "@/domain/ai-qualification";
import { generatePublicReference } from "@/lib/services/reference";
import { normalizeEmail } from "@/lib/services/identity";

let db: AppDatabase;

beforeAll(async () => {
  db = await createTestDb();
});

describe("AiConversationRepository", () => {
  it("creates a conversation with an empty qualification state and active status", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const conversation = await repo.create("session-a", "fr");
    expect(conversation.status).toBe("active");
    expect(conversation.qualificationState).toEqual(EMPTY_QUALIFICATION_STATE);
    expect(conversation.locale).toBe("fr");
  });

  it("enforces session ownership on lookup", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const conversation = await repo.create("session-owner", "en");

    const ownFetch = await repo.findByIdForSession(conversation.id, "session-owner");
    expect(ownFetch?.id).toBe(conversation.id);

    const otherFetch = await repo.findByIdForSession(conversation.id, "session-intruder");
    expect(otherFetch).toBeNull();
  });

  it("appends messages in order and counts them", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const conversation = await repo.create("session-b", "en");

    await repo.appendMessage(conversation.id, "user", "Hello");
    await repo.appendMessage(conversation.id, "assistant", "Hi there!");

    const messages = await repo.listMessages(conversation.id);
    expect(messages.map((m) => m.content)).toEqual(["Hello", "Hi there!"]);
    await expect(repo.countMessages(conversation.id)).resolves.toBe(2);
  });

  it("persists an updated qualification state and summary", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const conversation = await repo.create("session-c", "en");

    const newState = { ...EMPTY_QUALIFICATION_STATE, summary: "irrelevant here" };
    await repo.updateQualificationState(conversation.id, newState);
    await repo.updateSummary(conversation.id, "Client wants a mobile app.");

    const updated = await repo.findByIdForSession(conversation.id, "session-c");
    expect(updated?.qualificationState).toEqual(newState);
    expect(updated?.summary).toBe("Client wants a mobile app.");
  });

  it("links a real lead and marks the conversation converted, then finds it by lead id", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const leadRepo = createTestLeadRepository(async () => db);
    const conversation = await repo.create("session-d", "en");

    const email = "ai-linked-lead@example.com";
    const lead = await leadRepo.createLead({
      publicReference: generatePublicReference(),
      name: "AI Linked Lead",
      email,
      emailNormalized: normalizeEmail(email),
      language: "en",
      source: "contact_form",
    });

    await repo.linkLead(conversation.id, lead.id);

    const updated = await repo.findByIdForSession(conversation.id, "session-d");
    expect(updated?.status).toBe("converted");
    expect(updated?.leadId).toBe(lead.id);

    const foundByLead = await repo.findByLeadId(lead.id);
    expect(foundByLead?.id).toBe(conversation.id);
  });

  it("rejects linking a lead that doesn't exist (referential integrity)", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const conversation = await repo.create("session-d2", "en");
    await expect(repo.linkLead(conversation.id, "00000000-0000-0000-0000-0000000000d1")).rejects.toThrow();
  });

  it("marks a conversation's status directly", async () => {
    const repo = createTestAiConversationRepository(async () => db);
    const conversation = await repo.create("session-e", "en");
    await repo.markStatus(conversation.id, "expired");
    const updated = await repo.findByIdForSession(conversation.id, "session-e");
    expect(updated?.status).toBe("expired");
  });
});
