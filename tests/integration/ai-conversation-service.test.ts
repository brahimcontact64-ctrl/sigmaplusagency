import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, type AppDatabase } from "@/lib/db/client";
import { createTestAiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { AIConversationService } from "@/lib/services/ai-conversation-service";
import { AI_LIMITS } from "@/domain/ai-conversation";
import { FakeAIProvider } from "./helpers/fake-ai-provider";
import type { AiMessage } from "@/domain/ai-conversation";

function makeHistory(count: number): AiMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    conversationId: "conv-1",
    role: i % 2 === 0 ? "user" : "assistant",
    content: `message ${i}`,
    createdAt: new Date(),
  }));
}

describe("AIConversationService.buildPromptMessages", () => {
  const provider = new FakeAIProvider();
  const service = new AIConversationService(provider);

  it("sends the full history when it's shorter than the recent-turns window", () => {
    const history = makeHistory(4);
    const messages = service.buildPromptMessages(history, undefined);
    expect(messages).toHaveLength(4);
  });

  it("caps to the most recent N turns once history exceeds the window", () => {
    const history = makeHistory(AI_LIMITS.recentTurnsForPrompt + 10);
    const messages = service.buildPromptMessages(history, undefined);
    // +1 because a summary line is prepended once history exceeds the window and a summary exists — but none was passed here.
    expect(messages).toHaveLength(AI_LIMITS.recentTurnsForPrompt);
  });

  it("prepends a summary line only when history exceeds the window and a summary exists", () => {
    const shortHistory = makeHistory(4);
    const withSummaryShort = service.buildPromptMessages(shortHistory, "an old summary");
    expect(withSummaryShort).toHaveLength(4); // no summary line — history is still short

    const longHistory = makeHistory(AI_LIMITS.recentTurnsForPrompt + 10);
    const withSummaryLong = service.buildPromptMessages(longHistory, "an old summary");
    expect(withSummaryLong).toHaveLength(AI_LIMITS.recentTurnsForPrompt + 1);
    expect(withSummaryLong[0]!.content).toContain("an old summary");
  });
});

describe("AIConversationService.maybeUpdateSummary", () => {
  let db: AppDatabase;

  beforeAll(async () => {
    db = await createTestDb();
  });

  it("does nothing when history length isn't a multiple of summarizeEveryNMessages", async () => {
    const provider = new FakeAIProvider(["a summary"]);
    const repo = createTestAiConversationRepository(async () => db);
    const service = new AIConversationService(provider, repo);
    const conversation = await repo.create("session-1", "en");

    await service.maybeUpdateSummary(conversation.id, makeHistory(5), undefined);
    expect(provider.completeCalls).toHaveLength(0);
  });

  it("calls the provider and persists a summary once the threshold is crossed", async () => {
    const provider = new FakeAIProvider(["Client wants an e-commerce site."]);
    const repo = createTestAiConversationRepository(async () => db);
    const service = new AIConversationService(provider, repo);
    const conversation = await repo.create("session-2", "en");

    // Must be both a multiple of summarizeEveryNMessages AND greater than
    // recentTurnsForPrompt for the update to actually trigger — 24 satisfies both (12 and 16).
    const history = makeHistory(AI_LIMITS.summarizeEveryNMessages * 2);
    await service.maybeUpdateSummary(conversation.id, history, undefined);

    expect(provider.completeCalls).toHaveLength(1);
    const updated = await repo.findByIdForSession(conversation.id, "session-2");
    expect(updated?.summary).toBe("Client wants an e-commerce site.");
  });

  it("never throws when the provider fails — summary is a cost optimization, not a correctness requirement", async () => {
    const provider = new FakeAIProvider();
    provider.complete = async () => {
      throw new Error("boom");
    };
    const repo = createTestAiConversationRepository(async () => db);
    const service = new AIConversationService(provider, repo);
    const conversation = await repo.create("session-3", "en");

    await expect(
      service.maybeUpdateSummary(conversation.id, makeHistory(AI_LIMITS.summarizeEveryNMessages), undefined),
    ).resolves.toBeUndefined();
  });
});
