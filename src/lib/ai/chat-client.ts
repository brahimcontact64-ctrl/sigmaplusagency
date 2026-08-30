import type { QualificationState } from "@/domain/ai-qualification";
import type { AiChatError } from "@/domain/ai-chat";

export type SendAiMessageParams = {
  sessionId: string;
  conversationId?: string;
  locale: string;
  message: string;
  signal: AbortSignal;
  onConversation: (conversationId: string) => void;
  onToken: (text: string) => void;
  onQualification: (state: QualificationState) => void;
  onDone: () => void;
  onStreamError: (message: string) => void;
};

export type SendAiMessageError = { kind: "http"; error: AiChatError | "unknown" } | { kind: "stream"; message: string };

/**
 * Hand-rolled SSE client — no dependency needed for a simple
 * token/qualification/done event stream. Parses `event:`/`data:` frames
 * separated by a blank line, per the standard SSE text format the
 * route handler writes (see src/app/api/ai/consultant/route.ts).
 */
export async function sendAiMessage(params: SendAiMessageParams): Promise<SendAiMessageError | null> {
  const response = await fetch("/api/ai/consultant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: params.sessionId,
      conversationId: params.conversationId,
      locale: params.locale,
      message: params.message,
    }),
    signal: params.signal,
  });

  if (!response.ok || !response.body) {
    let error: AiChatError | "unknown" = "unknown";
    try {
      const body = await response.json();
      if (typeof body?.error === "string") error = body.error;
    } catch {
      // non-JSON error body — keep "unknown"
    }
    return { kind: "http", error };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      handleFrame(frame, params);
      boundary = buffer.indexOf("\n\n");
    }
  }

  return null;
}

function handleFrame(frame: string, params: SendAiMessageParams) {
  let event = "message";
  let dataLine = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
  }
  if (!dataLine) return;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(dataLine);
  } catch {
    return;
  }

  switch (event) {
    case "conversation":
      if (typeof data.conversationId === "string") params.onConversation(data.conversationId);
      break;
    case "token":
      if (typeof data.text === "string") params.onToken(data.text);
      break;
    case "qualification":
      if (data.state) params.onQualification(data.state as QualificationState);
      break;
    case "done":
      params.onDone();
      break;
    case "error":
      params.onStreamError(typeof data.message === "string" ? data.message : "The assistant hit an error.");
      break;
  }
}
