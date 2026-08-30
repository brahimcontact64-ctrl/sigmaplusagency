import type { AiConversation } from "@/domain/ai-conversation";
import type { AiMessage } from "@/domain/ai-conversation";
import { formatDateTime } from "@/lib/admin/format";

/**
 * Deliberately compact — never dumps the raw transcript into the main
 * lead detail view (master plan Phase 6 §22). The transcript itself is
 * available in a native <details> below, collapsed by default.
 */
export function AiConsultationSection({ conversation, messages }: { conversation: AiConversation; messages: AiMessage[] }) {
  const state = conversation.qualificationState;
  const confirmedEntries = Object.entries(state).filter(
    ([key, value]) =>
      value &&
      typeof value === "object" &&
      "confidence" in value &&
      (value as { confidence: string }).confidence === "USER_CONFIRMED" &&
      key !== "openQuestions" &&
      key !== "recommendedServices",
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">AI Consultation</h2>
        <span className="text-xs text-muted">{conversation.status}</span>
      </div>

      {conversation.summary && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted">Summary (AI-generated — not the client&apos;s own words)</p>
          <p className="mt-1 text-sm text-foreground">{conversation.summary}</p>
        </div>
      )}

      {confirmedEntries.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-muted">Client-confirmed</p>
          <dl className="grid gap-1 sm:grid-cols-2">
            {confirmedEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2 text-sm">
                <dt className="text-muted">{key}</dt>
                <dd className="text-foreground">{formatFieldValue((value as { value: unknown }).value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {state.recommendedServices.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted">AI-recommended services</p>
          <p className="mt-1 text-sm text-foreground">{state.recommendedServices.join(", ")}</p>
        </div>
      )}

      {state.openQuestions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted">Open questions</p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground">
            {state.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-primary-bright">
          View full transcript ({messages.length} messages)
        </summary>
        <ol className="mt-3 flex flex-col gap-2 border-s border-border ps-4">
          {messages.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="text-xs font-medium text-muted">{m.role === "user" ? "Client" : "SIGMA AI"}</span>
              <p className="whitespace-pre-wrap text-foreground">{m.content}</p>
              <span className="text-xs text-muted">{formatDateTime(m.createdAt)}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function formatFieldValue(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
