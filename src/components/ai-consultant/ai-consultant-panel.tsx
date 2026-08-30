"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { QualificationCard } from "./qualification-card";
import { LeadCaptureForm, type LeadCaptureValues } from "./lead-capture-form";
import { UnavailableNotice } from "./unavailable-notice";
import { getOrCreateAiSessionId } from "@/lib/ai/session-id";
import { sendAiMessage } from "@/lib/ai/chat-client";
import { mapQualificationToBuilderPrefill } from "@/lib/ai/qualification-to-builder";
import { requestAiProposalAction, logAiHandoffToBuilderAction } from "@/lib/actions/ai-consultant";
import { getClientAttribution } from "@/lib/attribution";
import { track } from "@/lib/integrations/analytics";
import {
  EMPTY_QUALIFICATION_STATE,
  confirmAllInferred,
  hasMinimalQualification,
  type QualificationState,
  type QualificationFieldKey,
} from "@/domain/ai-qualification";
import type { AiChatError } from "@/domain/ai-chat";
import type { Locale } from "@/i18n/routing";

type LocalMessage = { id: string; role: "user" | "assistant"; content: string };

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

export function AiConsultantPanel({ locale, available }: { locale: Locale; available: boolean }) {
  const t = useTranslations("aiConsultant");
  const router = useRouter();

  const [sessionId, setSessionId] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [qualification, setQualification] = useState<QualificationState>(EMPTY_QUALIFICATION_STATE);
  const [confirmed, setConfirmed] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [captureSubmitting, setCaptureSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [proposalResult, setProposalResult] = useState<{ reference: string; whatsappUrl: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-only localStorage read, not a render cascade
    setSessionId(getOrCreateAiSessionId());
    track("ai_consultant_viewed");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const httpErrorMessage: Record<AiChatError, string> = {
    invalid_request: t("errorGeneric"),
    rate_limited: t("rateLimited"),
    message_too_long: t("errorGeneric"),
    conversation_limit_reached: t("limitReached"),
    conversation_expired: t("expired"),
    ai_unavailable: t("unavailableTitle"),
    not_found: t("expired"),
    unexpected: t("errorGeneric"),
  };

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming || !available) return;

    setNotice(null);
    setMessages((prev) => [...prev, { id: nextLocalId(), role: "user", content: trimmed }]);
    setInput("");
    setStreaming(true);

    const assistantId = nextLocalId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await sendAiMessage({
        sessionId,
        conversationId,
        locale,
        message: trimmed,
        signal: controller.signal,
        onConversation: (id) => setConversationId(id),
        onToken: (chunk) =>
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))),
        onQualification: (state) => setQualification(state),
        onDone: () => setStreaming(false),
        onStreamError: (message) => {
          setNotice(message);
          track("ai_error", { stage: "stream" });
        },
      });

      if (result?.kind === "http") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setNotice(httpErrorMessage[result.error === "unknown" ? "unexpected" : result.error]);
        track("ai_error", { stage: "http" });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setNotice(t("errorGeneric"));
        track("ai_error", { stage: "network" });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleAbort() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function handleFieldEdit(key: QualificationFieldKey, value: string) {
    setQualification((prev) => ({ ...prev, [key]: { value, confidence: "USER_CONFIRMED" } }) as QualificationState);
  }

  function handleConfirmAll() {
    setQualification((prev) => confirmAllInferred(prev));
    setConfirmed(true);
  }

  function handleContinueBuilder() {
    const prefill = mapQualificationToBuilderPrefill(qualification);
    try {
      window.sessionStorage.setItem("sigma_ai_handoff", JSON.stringify(prefill));
    } catch {
      // storage unavailable — the builder just opens empty, not a hard failure
    }
    track("ai_builder_handoff", { hasConversation: Boolean(conversationId) });
    if (conversationId) void logAiHandoffToBuilderAction({ conversationId, sessionId });
    router.push(`/${locale}/start-project?from=ai`);
  }

  async function handleProposalSubmit(values: LeadCaptureValues) {
    if (!conversationId) return;
    setCaptureSubmitting(true);
    setCaptureError(null);

    const result = await requestAiProposalAction({
      conversationId,
      sessionId,
      locale,
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      company: values.company || undefined,
      confirmed,
      ...getClientAttribution(),
    });

    setCaptureSubmitting(false);

    if (!result.success) {
      setCaptureError(t("errorGeneric"));
      return;
    }

    setProposalResult(result);
    setShowCapture(false);
    track("ai_contact_requested", { conversationId });
    track("lead_created", { source: "ai_consultant" });
  }

  if (!available) {
    return <UnavailableNotice locale={locale} message={t("unavailableTitle")} />;
  }

  const canHandoff = hasMinimalQualification(qualification);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">{t("disclaimer")}</p>

        <div
          ref={scrollRef}
          className="flex h-[50vh] min-h-80 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-void/40 p-4 sm:h-[55vh]"
        >
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted">{t("suggestedLabel")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {(t.raw("suggested") as string[]).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary-bright hover:text-primary-bright"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={m.id} role={m.role} content={m.content || (streaming && i === messages.length - 1 ? "…" : "")} />
          ))}

          <div aria-live="polite" className="sr-only">
            {streaming ? "SIGMA AI is responding…" : ""}
          </div>
        </div>

        {notice && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {notice}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="ai-consultant-input" className="sr-only">
            {t("placeholder")}
          </label>
          <textarea
            id="ai-consultant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder={t("placeholder")}
            rows={2}
            maxLength={2000}
            className="min-h-12 flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-bright"
          />
          {streaming ? (
            <Button type="button" variant="outline" size="md" onClick={handleAbort} aria-label="Stop generating">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="md" disabled={!input.trim()} aria-label={t("send")}>
              <Send className="size-4 rtl:-scale-x-100" />
            </Button>
          )}
        </form>

        {/* Mobile: qualification card collapses below the composer instead of taking sidebar space. */}
        <details className="lg:hidden">
          <summary className="cursor-pointer text-sm font-medium text-primary-bright">
            {t("hero.eyebrow")}
          </summary>
          <div className="mt-3">
            <QualificationCard state={qualification} onFieldEdit={handleFieldEdit} onConfirmAll={handleConfirmAll} confirmed={confirmed} />
          </div>
        </details>

        {proposalResult ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <p className="font-medium">{t("proposalSuccessTitle")}</p>
            <p>{t("proposalSuccessBody", { reference: proposalResult.reference })}</p>
          </div>
        ) : (
          canHandoff && (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" size="md" onClick={handleContinueBuilder}>
                {t("continueBuilder")}
              </Button>
              {!showCapture && (
                <Button type="button" size="md" onClick={() => setShowCapture(true)}>
                  {t("requestProposal")}
                </Button>
              )}
            </div>
          )
        )}

        {showCapture && !proposalResult && (
          <LeadCaptureForm onSubmit={handleProposalSubmit} submitting={captureSubmitting} error={captureError} />
        )}
      </div>

      <div className="hidden lg:block">
        <QualificationCard state={qualification} onFieldEdit={handleFieldEdit} onConfirmAll={handleConfirmAll} confirmed={confirmed} />
      </div>
    </div>
  );
}
