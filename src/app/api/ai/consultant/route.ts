import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { aiChatRequestSchema } from "@/domain/ai-chat";
import { AI_LIMITS, isConversationExpired } from "@/domain/ai-conversation";
import { getAIProvider } from "@/lib/ai/get-provider";
import { getAiConversationRepository } from "@/lib/repositories/ai-conversation-repository";
import { AIConversationService } from "@/lib/services/ai-conversation-service";
import { QualificationService } from "@/lib/services/ai-qualification-service";
import { aiMessageSessionRateLimiter, aiMessageIpRateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { trackServer } from "@/lib/integrations/analytics-server";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";

/**
 * The only network boundary for SIGMA AI. Every request is validated,
 * rate-limited, and length/count-capped before it ever reaches the
 * provider — see master plan Phase 6 "cost controls". Streams the
 * reply as Server-Sent Events (token/qualification/done/error frames)
 * so the client can render progressively and react to the qualification
 * update without a second round trip.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = aiChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { sessionId, conversationId, locale, message } = parsed.data;

  const ip = await getClientIp();
  if (!(await aiMessageSessionRateLimiter.check(`ai-session:${sessionId}`)) || !(await aiMessageIpRateLimiter.check(`ai-ip:${ip}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (isMaintenanceModeEnabled()) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  const provider = getAIProvider();
  if (!provider) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  try {
    const repo = getAiConversationRepository();

    let conversation = conversationId ? await repo.findByIdForSession(conversationId, sessionId) : null;
    if (conversationId && !conversation) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (conversation && isConversationExpired(conversation)) {
      await repo.markStatus(conversation.id, "expired");
      return NextResponse.json({ error: "conversation_expired" }, { status: 410 });
    }

    const isNewConversation = !conversation;
    if (!conversation) {
      conversation = await repo.create(sessionId, locale);
      void trackServer("ai_consultation_started", { aiConversationId: conversation.id }, { anonymousSessionId: sessionId });
    }
    const conv = conversation;

    const messageCountBefore = await repo.countMessages(conv.id);
    if (messageCountBefore >= AI_LIMITS.maxConversationMessages) {
      return NextResponse.json({ error: "conversation_limit_reached", conversationId: conv.id }, { status: 409 });
    }

    const userMessage = await repo.appendMessage(conv.id, "user", message);
    void trackServer("ai_message_sent", { aiConversationId: conv.id, isNewConversation }, { anonymousSessionId: sessionId });

    const history = await repo.listMessages(conv.id);
    const conversationService = new AIConversationService(provider, repo);
    const promptMessages = conversationService.buildPromptMessages(history, conv.summary);

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }

        send("conversation", { conversationId: conv.id, isNew: isNewConversation });

        let fullText = "";
        try {
          for await (const chunk of conversationService.streamReply(locale, promptMessages, request.signal)) {
            fullText += chunk;
            send("token", { text: chunk });
          }
        } catch (error) {
          console.error("[ai-consultant] stream failed:", error);
          send("error", { message: "The assistant had a problem generating a reply. Please try again." });
          controller.close();
          return;
        }

        await repo.appendMessage(conv.id, "assistant", fullText || "…");

        let updatedState = conv.qualificationState;
        try {
          const qualificationService = new QualificationService(provider);
          updatedState = await qualificationService.extract({
            locale,
            existingState: conv.qualificationState,
            transcript: [...promptMessages, { role: "assistant", content: fullText }],
            latestUserMessageId: userMessage.id,
          });
          await repo.updateQualificationState(conv.id, updatedState);
          void trackServer("ai_qualification_updated", { aiConversationId: conv.id }, { anonymousSessionId: sessionId });
        } catch (error) {
          console.error("[ai-consultant] qualification extraction failed:", error);
        }

        send("qualification", { state: updatedState });

        try {
          const updatedHistory = await repo.listMessages(conv.id);
          await conversationService.maybeUpdateSummary(conv.id, updatedHistory, conv.summary);
        } catch (error) {
          console.error("[ai-consultant] summary update failed:", error);
        }

        send("done", {});
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[ai-consultant] request failed:", error);
    void trackServer("ai_error", { reason: "request" }, { anonymousSessionId: sessionId });
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

const resumeParamsSchema = z.object({ sessionId: z.uuid(), conversationId: z.uuid() });

/** Resume an existing conversation after a page reload — ownership-checked by sessionId, same as the POST handler. */
export async function GET(request: NextRequest) {
  const parsed = resumeParamsSchema.safeParse({
    sessionId: request.nextUrl.searchParams.get("sessionId"),
    conversationId: request.nextUrl.searchParams.get("conversationId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const repo = getAiConversationRepository();
    const conversation = await repo.findByIdForSession(parsed.data.conversationId, parsed.data.sessionId);
    if (!conversation) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const messages = await repo.listMessages(conversation.id);
    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
      qualificationState: conversation.qualificationState,
      messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt.toISOString() })),
    });
  } catch (error) {
    console.error("[ai-consultant] resume failed:", error);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}
